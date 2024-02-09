import random
import pandas as pd
from datetime import datetime, timedelta, time
from django.core.management import BaseCommand
from faker import Faker

from django.db.models import Q
from django.utils.timezone import make_aware
from api.v1.v1_data.models import (
    FormData,
    PendingFormData,
    PendingDataBatch,
    PendingDataApproval
)
from api.v1.v1_users.models import SystemUser
from api.v1.v1_forms.models import UserForms, FormApprovalAssignment
from api.v1.v1_forms.constants import FormTypes
from api.v1.v1_data.management.commands.fake_data_seeder import (
    add_fake_answers
)
from api.v1.v1_profile.models import Administration, Levels
from api.v1.v1_data.functions import refresh_materialized_data
from api.v1.v1_data.tasks import seed_approved_data
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_data.constants import DataApprovalStatus

fake = Faker()


def create_new_endpoint(index, form, administration, user):
    fake_geo = pd.read_csv("./source/kenya_random_points-2024.csv")
    fake_geo = fake_geo.sample(frac=1).reset_index(drop=True)
    geo = fake_geo.iloc[index].to_dict()
    geo_value = [geo["X"], geo["Y"]]
    data = FormData.objects.create(
        name=fake.pystr_format(),
        geo=geo_value,
        form=form,
        administration=administration,
        created_by=user,
    )
    now_date = datetime.now()
    start_date = now_date - timedelta(days=5 * 365)
    created = fake.date_between(start_date, now_date)
    created = datetime.combine(created, time.min)
    data.created = make_aware(created)
    data.save()
    add_fake_answers(data, form.type)
    return data


def seed_data(form, user, administrations, repeat):
    pendings = []
    for index in range(repeat):
        selected_adm = random.choice(administrations)
        datapoint = FormData.objects.filter(
            administration=selected_adm,
            created_by_id=user.id,
            form_id=form.id,
            parent=None,
        ).order_by('?').first()
        if not datapoint:
            datapoint = create_new_endpoint(index, form, selected_adm, user)
        adm_name = datapoint.administration.name
        dp_name = fake.sentence(nb_words=3)
        pending_data = PendingFormData.objects.create(
            name=f"{adm_name} - {dp_name}",
            geo=datapoint.geo,
            uuid=datapoint.uuid,
            form=datapoint.form,
            administration=datapoint.administration,
            created_by=user,
        )
        add_fake_answers(
            pending_data,
            form_type=FormTypes.county,
            pending=True
        )
        pendings.append(pending_data)
    pending_items = [
        {
            'administration_id': pending.administration.id,
            'instance': pending
        }
        for pending in pendings
    ]
    df = pd.DataFrame(pending_items)
    grouped_data = df.groupby(['administration_id']) \
        .apply(lambda x: x.to_dict('records'))
    for administration_id, items in grouped_data.items():
        [dp] = items[:1]
        batch_name = fake.sentence(nb_words=3)
        batch = PendingDataBatch.objects.create(
            form=dp['instance'].form,
            administration=dp['instance'].administration,
            user=dp['instance'].created_by,
            name=f"{batch_name}-{administration_id}",
            approved=fake.pybool(),
        )
        batch_items = [i['instance'] for i in items]
        batch.batch_pending_data_batch.add(*batch_items)
        path = "{0}{1}".format(
            user.user_access.administration.path,
            user.user_access.administration_id
        )
        parent_adms = Administration.objects.filter(id__in=path.split("."))
        for adm in parent_adms:
            assignment = FormApprovalAssignment.objects.filter(
                form_id=form.id,
                administration=adm
            ).first()
            if assignment:
                level = assignment.user.user_access.administration.level_id
                approval_status = DataApprovalStatus.approved \
                    if batch.approved else DataApprovalStatus.pending
                PendingDataApproval.objects.create(
                    batch=batch,
                    user=assignment.user,
                    level_id=level,
                    status=approval_status
                )
        if batch.approved:
            for pending in batch.batch_pending_data_batch.all():
                seed_approved_data(pending)


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("-r",
                            "--repeat",
                            nargs="?",
                            const=20,
                            default=20,
                            type=int)
        parser.add_argument("-t",
                            "--test",
                            nargs="?",
                            const=False,
                            default=False,
                            type=bool)

    def handle(self, *args, **options):
        test = options.get("test")
        repeat = options.get("repeat")
        lowest_level = Levels.objects.order_by('-id').first()
        user = SystemUser.objects.filter(
            user_access__role=UserRoleTypes.user,
            user_access__administration__level_id__gte=lowest_level.id - 1
        )\
            .order_by('?').first()
        if user:
            ward_id = user.user_access.administration.id
            if lowest_level.id == user.user_access.administration.level.id:
                parent = list(filter(
                    lambda p: p,
                    user.user_access.administration.path.split(".")
                ))[-1]
                ward_id = parent
                user.user_access.administration_id = parent
                user.user_access.save()
            administrations = Administration.objects.filter(
                Q(parent=ward_id) | Q(pk=ward_id)
            )
            user_forms = UserForms.objects.filter(user=user).all()
            if not test:
                print(f"\nCreated by: {user.email}")
            for user_form in user_forms:
                if not test:
                    print(f"\nSeeding - {user_form.form.name}")
                seed_data(user_form.form, user, administrations, repeat)
            refresh_materialized_data()
