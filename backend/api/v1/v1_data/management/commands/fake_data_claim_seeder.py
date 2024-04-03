import pandas as pd
from datetime import datetime, timedelta, time
from django.core.management import BaseCommand
from django.utils.timezone import make_aware
from faker import Faker
from api.v1.v1_data.models import FormData
from api.v1.v1_forms.constants import FormTypes, SubmissionTypes
from api.v1.v1_forms.models import (
    Forms, FormCertificationAssignment, UserForms
)
from api.v1.v1_profile.models import Administration, Access
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_users.models import (
    SystemUser,
    UserDesignationTypes,
)
from api.v1.v1_data.functions import refresh_materialized_data
from api.v1.v1_data.management.commands.fake_data_seeder import (
    add_fake_answers
)

fake = Faker()


def create_data_entry(administration, form):
    user = SystemUser.objects.create(
        email=fake.email(),
        first_name=fake.first_name(),
        last_name=fake.last_name(),
        phone_number=fake.msisdn(),
        designation=UserDesignationTypes.sa)
    user.set_password("test")
    user.save()
    Access.objects.create(
        user=user,
        role=UserRoleTypes.user,
        administration=administration
    )
    UserForms.objects.create(
        user=user,
        form=form
    )
    return user


def seed_data(form, fake_geo, repeat, villages):
    v_len = len(villages)
    for i in range(repeat):
        village = villages[i % v_len]
        ward_user = SystemUser.objects.filter(
            user_access__administration=village.parent
        ).first()
        if not ward_user:
            ward_user = create_data_entry(
                administration=village.parent,
                form=form
            )
        now_date = datetime.now()
        start_date = now_date - timedelta(days=5 * 365)
        created = fake.date_between(start_date, now_date)
        created = datetime.combine(created, time.min)
        geo = fake_geo.iloc[i].to_dict()
        geo_value = [geo["X"], geo["Y"]]
        test_data = FormData.objects.create(
            name=fake.pystr_format(),
            geo=geo_value,
            form=form,
            administration=village,
            created_by=ward_user,
            submission_type=SubmissionTypes.certification,
        )
        test_data.created = make_aware(created)
        test_data.save_to_file
        test_data.save()
        add_fake_answers(test_data, form.type)


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "-r", "--repeat", nargs="?", const=20, default=10, type=int
        )
        parser.add_argument(
            "-t", "--test", nargs="?", const=False, default=False, type=bool
        )

    def handle(self, *args, **options):
        test = options.get("test")
        repeat = options.get("repeat")
        FormData.objects.all().delete()
        fake_geo = pd.read_csv("./source/kenya_random_points-2024.csv")
        fake_geo = fake_geo.sample(frac=1).reset_index(drop=True)
        subcounty_user = (
            SystemUser.objects.filter(
                user_access__administration__level__name="Sub-County"
            )
            .order_by("?")
            .first()
        )
        adm_user = subcounty_user.user_access.administration
        adm_parent_path = f"{adm_user.parent.path}{adm_user.parent.pk}"
        villages = (
            Administration.objects.filter(
                path__startswith=adm_parent_path, level__name="Village"
            )
            .exclude(
                path__contains=subcounty_user.user_access.administration.pk
            )
            .order_by("?")
            .all()[:repeat]
        )
        assignment = FormCertificationAssignment(assignee=adm_user)
        assignment.save()
        assignment.administrations.set(villages)
        certification_forms = Forms.objects.filter(
            submission_types__contains=[SubmissionTypes.certification],
            type=FormTypes.county
        ).all()
        for form in certification_forms:
            if not test:
                print(f"\nSeeding - {form.name}")
            seed_data(
                form=form,
                fake_geo=fake_geo,
                repeat=repeat,
                villages=villages,
            )
        refresh_materialized_data()
