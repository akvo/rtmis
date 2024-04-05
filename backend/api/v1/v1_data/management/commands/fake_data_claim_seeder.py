import pandas as pd
from django.core.management import BaseCommand
from faker import Faker
from api.v1.v1_data.models import (
    FormData, PendingFormData
)
from api.v1.v1_forms.constants import FormTypes, SubmissionTypes
from api.v1.v1_forms.models import (
    Forms, FormCertificationAssignment, UserForms
)
from api.v1.v1_profile.models import Administration, Levels
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_users.models import SystemUser
# from api.v1.v1_data.functions import refresh_materialized_data
from api.v1.v1_data.management.commands.fake_data_seeder import (
    add_fake_answers
)
from api.v1.v1_users.management.commands.demo_approval_flow import (
    create_approver
)
from api.v1.v1_data.serializers import CreateBatchSerializer
from api.v1.v1_data.constants import DataApprovalStatus
from api.v1.v1_data.tasks import seed_approved_data
from api.v1.v1_mobile.models import MobileAssignment
fake = Faker()


def create_certification(assignee, certification, form):
    subcounty_path = f"{assignee.parent.path}{assignee.parent.pk}"
    certify_assignment = FormCertificationAssignment(assignee=assignee)
    certify_assignment.save()
    certify_assignment.administrations.set(certification)

    entry_user = SystemUser.objects.filter(
        user_access__administration__path__startswith=subcounty_path,
        user_access__administration__level__name="Ward",
        user_access__role=UserRoleTypes.user,
    ).order_by('?').first()

    UserForms.objects.get_or_create(form=form, user=entry_user)

    mobile_assignment = entry_user.mobile_assignments.filter(
        forms__id__in=[form.pk]
    ).first()
    if not mobile_assignment:
        mobile_assignment = MobileAssignment.objects.create_assignment(
            user=entry_user,
            name=fake.user_name(),
            certification=certification
        )
        mobile_assignment.forms.add(form)
    administration_children = Administration.objects.filter(
        parent=entry_user.user_access.administration
    ).order_by('?')[:2]
    mobile_assignment.administrations.set(
        administration_children
    )
    mobile_assignment.certifications.set(certification)
    submitter_name = mobile_assignment.name
    return entry_user, submitter_name


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "-r",
            "--repeat",
            nargs="?",
            const=10,
            default=10,
            type=int
        )
        parser.add_argument(
            "-t", "--test", nargs="?", const=False, default=False, type=bool
        )

    def handle(self, *args, **options):
        test = options.get("test")
        repeat = options.get("repeat")
        fake_geo = pd.read_csv("./source/kenya_random_points-2024.csv")
        fake_geo = fake_geo.sample(frac=1).reset_index(drop=True)
        certification_forms = Forms.objects.filter(
            submission_types__contains=[SubmissionTypes.certification],
            type=FormTypes.county,
        ).all()
        for form in certification_forms:
            print(f"Seeding - {form.name}")
            existing_certification_uuids = FormData.objects.filter(
                form=form,
                submission_type=SubmissionTypes.certification
            ).values('uuid')
            datapoints = FormData.objects.filter(
                form=form,
                submission_type=SubmissionTypes.registration
            ) \
                .exclude(uuid__in=existing_certification_uuids) \
                .order_by('-id')[:repeat]
            last_level = Levels.objects.order_by('-level').first()
            for dp in datapoints:
                stop_level = last_level.level - 1
                target_id = dp.administration.path.split(".")[2:stop_level][0]
                target_adms = Administration.objects.filter(
                    path__startswith=dp.administration.path
                )\
                    .exclude(pk=dp.administration.pk) \
                    .order_by('?')[:2]
                target_stop = stop_level - 1
                target_path = ".".join(
                    dp.administration.path.split(".")[0:target_stop]
                )
                user_assignee = SystemUser.objects.filter(
                    user_access__administration__path__startswith=target_path,
                    user_access__administration__level__name="Sub-County",
                    user_form__form_id__in=[form.pk]
                )\
                    .exclude(
                        user_access__administration__id=target_id
                    ).order_by('?').first()
                if not user_assignee:
                    subcounty = Administration.objects.filter(
                            path__startswith=target_path,
                            level__name="Sub-County"
                    ) \
                       .exclude(pk=target_id).order_by('?').first()
                    approver = create_approver(
                        form=form,
                        administration=subcounty,
                        organisation=dp.created_by.organisation
                    )
                    user_assignee = approver.user
                if user_assignee:
                    assignee = user_assignee.user_access.administration
                    certification = [dp.administration, *target_adms]
                    if not test:
                        print(f"Certifying Sub-county: {assignee}\n")
                        print(f"Villages to Certify: {certification}\n")
                    entry_user, submitter_name = create_certification(
                        assignee=assignee,
                        certification=certification,
                        form=form,
                    )
                    pending_data = PendingFormData.objects.create(
                        uuid=dp.uuid,
                        name=dp.name,
                        geo=dp.geo,
                        form=form,
                        administration=dp.administration,
                        created_by=entry_user,
                        submitter=submitter_name,
                        submission_type=SubmissionTypes.certification,
                    )
                    add_fake_answers(
                        pending_data,
                        form_type=FormTypes.county,
                        pending=True
                    )
                    batch = CreateBatchSerializer(data={
                        "name": fake.sentence(nb_words=2),
                        "comment": fake.sentence(nb_words=5),
                        "data": [pending_data.pk]
                    })
                    if batch.is_valid():
                        batch = batch.save(user=entry_user)
                        batch.approved = True
                        batch.save()
                        for approval in batch.batch_approval.all():
                            approval.status = DataApprovalStatus.approved
                            approval.save()
                        for pending in batch.batch_pending_data_batch.all():
                            pending
                            seed_approved_data(pending)
            # refresh_materialized_data()
