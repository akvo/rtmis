from django.core.management import BaseCommand
from faker import Faker
from api.v1.v1_data.models import FormData
from api.v1.v1_forms.constants import FormTypes, SubmissionTypes
from api.v1.v1_forms.models import (
    Forms,
    FormCertificationAssignment,
    UserForms,
)
from api.v1.v1_profile.models import Administration
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_users.models import SystemUser
from api.v1.v1_data.functions import refresh_materialized_data
from api.v1.v1_data.management.commands.fake_data_seeder import (
    add_fake_answers,
)
from api.v1.v1_mobile.models import MobileAssignment

fake = Faker()


def get_mobile_user(user: SystemUser, form: Forms):
    mobile_assignment = user.mobile_assignments.filter(
        forms__id__in=[form.pk]
    ).first()
    if not mobile_assignment:
        mobile_assignment = MobileAssignment.objects.create_assignment(
            user=user, name=fake.user_name()
        )
        mobile_assignment.forms.add(form)
    return mobile_assignment


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

        administration_children = Administration.objects.filter(
            parent=entry_user.user_access.administration
        ).order_by("?")[:2]

        mobile_assignment = get_mobile_user(user=entry_user, form=form)
        mobile_assignment.administrations.set(administration_children)
        mobile_assignment.certifications.set(certification)

    return certify_assignment


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "-r", "--repeat", nargs="?", const=10, default=10, type=int
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
            existing_certifications = FormData.objects.filter(
                form=form, submission_type=SubmissionTypes.certification
            )
            existing_certification_uuids = existing_certifications.values(
                "uuid"
            )

            existing_assignment = FormCertificationAssignment.objects.order_by(
                "?"
            ).first()
            if not existing_assignment:
                user_assignee = (
                    SystemUser.objects.filter(
                        user_access__administration__level__name="Sub-County",
                        user_form__form_id__in=[form.pk],
                    )
                    .order_by("?")
                    .first()
                )
                certification = FormData.objects.exclude(
                    administration=user_assignee.user_access.administration
                ).values_list("administration", flat=True)
                certification = list(certification)
                existing_assignment = create_certification(
                    assignee=user_assignee.user_access.administration,
                    certification=certification,
                    form=form,
                )
            assignee_path = "{0}{1}".format(
                existing_assignment.assignee.path,
                existing_assignment.assignee.id,
            )
            assignee_children = Administration.objects.filter(
                path__startswith=assignee_path
            ).all()

            queryset = FormData.objects.filter(
                form=form, submission_type=SubmissionTypes.registration
            ).exclude(uuid__in=existing_certification_uuids)

            target_adms = existing_assignment.administrations.values("id")
            queryset = queryset.filter(administration_id__in=target_adms)
            datapoints = queryset.order_by("-id")[:repeat]
            for dp in datapoints:
                created_by = SystemUser.objects.filter(
                    user_access__administration__path__startswith=assignee_path
                ).first()

                mobile_assignment = get_mobile_user(
                    user=created_by, form=dp.form
                )
                mobile_assignment.administrations.set(assignee_children)
                mobile_assignment.certifications.add(
                    *list(
                        existing_assignment.administrations.values_list(
                            "id", flat=True
                        )
                    )
                )

                data = FormData.objects.create(
                    name=f"{dp.name} - certification",
                    geo=dp.geo,
                    form=form,
                    administration=dp.administration,
                    created_by=created_by,
                    submission_type=SubmissionTypes.certification,
                )
                data.save_to_file
                data.save()
                add_fake_answers(data, form.type)

            # multiple certification (add second certificatio data)
            for dp in existing_certifications.all():
                data = FormData.objects.create(
                    name=f"{dp.name} - SECOND",
                    geo=dp.geo,
                    form=dp.form,
                    administration=dp.administration,
                    created_by=dp.created_by,
                    submission_type=SubmissionTypes.certification,
                    uuid=dp.uuid,
                )
                data.save_to_file
                data.save()
                add_fake_answers(data, form.type)

            refresh_materialized_data()
