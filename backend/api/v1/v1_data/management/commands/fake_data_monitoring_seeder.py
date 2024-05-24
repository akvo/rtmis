import pandas as pd
from datetime import datetime, timedelta, time
from django.core.management import BaseCommand
from faker import Faker

from django.utils.timezone import make_aware
from api.v1.v1_data.models import (
    FormData,
    PendingFormData,
    PendingDataBatch,
    PendingDataApproval,
)
from api.v1.v1_forms.models import Forms, FormApprovalAssignment
from api.v1.v1_forms.constants import FormTypes, SubmissionTypes
from api.v1.v1_data.management.commands.fake_data_seeder import (
    add_fake_answers,
)
from api.v1.v1_profile.models import Administration
from api.v1.v1_data.functions import refresh_materialized_data
from api.v1.v1_data.tasks import seed_approved_data
from api.v1.v1_data.constants import DataApprovalStatus

fake = Faker()


def create_registration(index, form, administration, user):
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


def seed_data(form, datapoint, user, repeat, approved):
    pendings = []
    for i in range(repeat):
        pending_data = PendingFormData.objects.create(
            name=datapoint.name,
            geo=datapoint.geo,
            uuid=datapoint.uuid,
            form=datapoint.form,
            administration=datapoint.administration,
            created_by=user,
            submission_type=SubmissionTypes.monitoring,
        )
        add_fake_answers(
            pending_data, form_type=FormTypes.county, pending=True
        )
        pendings.append(pending_data)
    pending_items = [
        {"administration_id": pending.administration.id, "instance": pending}
        for pending in pendings
    ]
    df = pd.DataFrame(pending_items)
    grouped_data = df.groupby(["administration_id"]).apply(
        lambda x: x.to_dict("records")
    )
    for administration_id, items in grouped_data.items():
        [dp] = items[:1]
        batch_name = fake.sentence(nb_words=3)
        batch = PendingDataBatch.objects.create(
            form=dp["instance"].form,
            administration=dp["instance"].administration,
            user=dp["instance"].created_by,
            name=f"{batch_name}-{administration_id}",
            approved=approved,
        )
        batch_items = [i["instance"] for i in items]
        batch.batch_pending_data_batch.add(*batch_items)
        path = "{0}{1}".format(
            user.user_access.administration.path,
            user.user_access.administration_id,
        )
        parent_adms = Administration.objects.filter(id__in=path.split("."))
        for adm in parent_adms:
            assignment = FormApprovalAssignment.objects.filter(
                form_id=form.id, administration=adm
            ).first()
            if assignment:
                level = assignment.user.user_access.administration.level_id
                approval_status = (
                    DataApprovalStatus.approved
                    if batch.approved
                    else DataApprovalStatus.pending
                )
                PendingDataApproval.objects.create(
                    batch=batch,
                    user=assignment.user,
                    level_id=level,
                    status=approval_status,
                )
        if batch.approved:
            for pending in batch.batch_pending_data_batch.all():
                seed_approved_data(pending)


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "-r", "--repeat", nargs="?", const=20, default=20, type=int
        )
        parser.add_argument(
            "-t", "--test", nargs="?", const=False, default=False, type=bool
        )
        parser.add_argument(
            "-a",
            "--approved",
            nargs="?",
            const=False,
            default=True,
            type=bool,
        )

    def handle(self, *args, **options):
        test = options.get("test")
        repeat = options.get("repeat")
        approved = options.get("approved")

        forms = Forms.objects.filter(type=FormTypes.county).all()
        for form in forms:
            if not test:
                print(f"Seeding - {form.name}")
            for dp in form.form_form_data.all():
                seed_data(
                    form=form,
                    datapoint=dp,
                    user=dp.created_by,
                    repeat=repeat,
                    approved=approved,
                )
            refresh_materialized_data()
