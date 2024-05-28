from django.core.management import BaseCommand
from faker import Faker
from api.v1.v1_data.models import FormData
from api.v1.v1_forms.constants import FormTypes, SubmissionTypes
from api.v1.v1_forms.models import (
    Forms,
    FormCertificationAssignment,
    UserForms,
)
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_users.models import SystemUser
from api.v1.v1_data.functions import refresh_materialized_data
from api.v1.v1_data.management.commands.fake_data_seeder import (
    add_fake_answers, get_mobile_user
)

fake = Faker()


def create_certification(assignee, certification, form):
    subcounty_path = f"{assignee.path}{assignee.pk}"
    certify_assignment = FormCertificationAssignment(assignee=assignee)
    certify_assignment.save()
    certify_assignment.administrations.set(certification)

    entry_user = (
        SystemUser.objects.filter(
            user_access__administration__path__startswith=subcounty_path,
            user_access__administration__level__name="Ward",
            user_access__role=UserRoleTypes.user,
        )
        .order_by("?")
        .first()
    )
    if entry_user:
        UserForms.objects.get_or_create(form=form, user=entry_user)
        get_mobile_user(user=entry_user, form=form)

    return certify_assignment


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "-r", "--repeat", nargs="?", const=2, default=2, type=int
        )
        parser.add_argument(
            "-t", "--test", nargs="?", const=False, default=False, type=bool
        )

    def handle(self, *args, **options):
        test = options.get("test")
        repeat = options.get("repeat")
        certification_forms = Forms.objects.filter(
            submission_types__contains=[SubmissionTypes.certification],
            type=FormTypes.county,
        ).all()
        for form in certification_forms:
            if not test:
                print(f"Seeding - {form.name}")
            certification_assignment = FormCertificationAssignment.objects \
                .order_by("?").first()
            if not certification_assignment:
                user_assignee = (
                    SystemUser.objects.filter(
                        user_access__administration__level__name="Sub-County",
                        user_form__form_id__in=[form.pk],
                    )
                    .order_by("?")
                    .first()
                )
                county_path = user_assignee.user_access.administration.path
                assignee_path = "{0}{1}".format(
                    county_path,
                    user_assignee.user_access.administration.id
                )
                certification = form.form_form_data.filter(
                    administration__path__startswith=county_path
                ).exclude(
                    administration__path__startswith=assignee_path
                ).values_list("administration", flat=True)
                assignee = user_assignee.user_access.administration
                certification = list(certification)[:4]
                certification_assignment = create_certification(
                    assignee=assignee,
                    certification=certification,
                    form=form,
                )
            adm_ids = certification_assignment.administrations.values("id")
            datapoints = form.form_form_data.filter(
                administration__in=adm_ids
            ).all()
            ap = "{0}{1}".format(
                certification_assignment.assignee.path,
                certification_assignment.assignee.id,
            )
            for dp in datapoints:
                created_by = SystemUser.objects.filter(
                    user_access__administration__path__startswith=ap,
                    user_access__role=UserRoleTypes.user
                ).first()
                for i in range(repeat):
                    data = FormData.objects.create(
                        uuid=dp.uuid,
                        name=dp.name,
                        geo=dp.geo,
                        form=form,
                        administration=dp.administration,
                        created_by=created_by,
                        submission_type=SubmissionTypes.certification,
                    )
                    data.save()
                    add_fake_answers(data, form.type)
                    data.save_to_file
            refresh_materialized_data()
