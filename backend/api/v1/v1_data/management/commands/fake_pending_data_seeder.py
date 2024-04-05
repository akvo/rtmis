import re
from datetime import timedelta

import pandas as pd
from django.core.management import BaseCommand
from django.utils import timezone
from faker import Faker

from api.v1.v1_data.models import PendingFormData, \
    PendingAnswers, PendingDataApproval, PendingDataBatch
from api.v1.v1_forms.constants import QuestionTypes, FormTypes, SubmissionTypes
from api.v1.v1_forms.models import FormApprovalAssignment
from api.v1.v1_forms.models import Forms, UserForms
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.management.commands.administration_seeder import (
    MAX_LEVEL_IN_SOURCE_FILE
)
from api.v1.v1_profile.models import Administration, Access, Levels
from api.v1.v1_users.models import SystemUser, Organisation
from api.v1.v1_users.management.commands.demo_approval_flow import (
    create_approver
)
fake = Faker()


def set_answer_data(data, question):
    name = None
    value = None
    option = None

    if question.type == QuestionTypes.geo:
        option = data.geo
    elif question.type == QuestionTypes.administration:
        name = data.administration.name
        value = data.administration.id
    elif question.type == QuestionTypes.text:
        name = fake.company() if question.meta else fake.sentence(nb_words=3)
    elif question.type == QuestionTypes.number:
        value = fake.random_int(min=10, max=50)
    elif question.type == QuestionTypes.option:
        option = [
            question.options.order_by('?').first().value
        ]
    elif question.type == QuestionTypes.multiple_option:
        option = list(
            question.options.order_by('?').values_list(
                'value', flat=True)[0:fake.random_int(min=1, max=3)])
    elif question.type == QuestionTypes.photo:
        name = fake.image_url()
    elif question.type == QuestionTypes.date:
        name = fake.date_between_dates(
            date_start=timezone.datetime.now().date() - timedelta(days=90),
            date_end=timezone.datetime.now().date()).strftime("%m/%d/%Y")
    else:
        pass
    return name, value, option


def add_fake_answers(data: PendingFormData):
    form = data.form
    meta_name = []
    for question in form.form_questions.all().order_by('order'):
        name, value, option = set_answer_data(data, question)
        if question.meta:
            if name:
                meta_name.append(name)
            elif option and question.type != QuestionTypes.geo:
                meta_name.append(','.join(option))
            elif value and question.type != QuestionTypes.administration:
                meta_name.append(str(value))
            else:
                pass

        if question.type == QuestionTypes.administration:
            name = None

        PendingAnswers.objects.create(
            pending_data=data,
            question=question,
            name=name,
            value=value,
            options=option,
            created_by=SystemUser.objects.order_by('?').first())
    data.name = ' - '.join(meta_name)
    data.save()


def seed_data(form, fake_geo, repeat, created_by):
    for i in range(repeat):
        administration = created_by.user_access.administration
        mobile_assignment = created_by.mobile_assignments.order_by('?').first()
        geo = fake_geo.iloc[i].to_dict()
        data = PendingFormData.objects.create(
            name=fake.pystr_format(),
            geo=[geo["X"], geo["Y"]],
            form=form,
            administration=administration,
            created_by=created_by,
            submission_type=SubmissionTypes.registration,
            submitter=mobile_assignment.name if mobile_assignment else None,
        )
        add_fake_answers(data)


def create_or_get_submitter(role):
    organisation = Organisation.objects.first()
    level = Levels.objects.filter(
        level__lt=MAX_LEVEL_IN_SOURCE_FILE
    ).order_by('-level').first()
    last_name = "User"
    email = "user"
    if role == UserRoleTypes.admin:
        level = Levels.objects.order_by('level')[1]
        last_name = "Admin"
        email = "test"
    administration = Administration.objects.filter(
        level=level).order_by('?').first()
    email = ("{}{}@{}.com").format(
        re.sub('[^A-Za-z0-9]+', '', administration.name.lower()),
        administration.id, email)
    submitter, created = SystemUser.objects.get_or_create(
        organisation=organisation,
        email=email,
        first_name=administration.name,
        last_name=last_name)
    if created:
        submitter.set_password("test")
        submitter.save()
        Access.objects.create(user=submitter,
                              role=role,
                              administration=administration)
    return submitter


def assign_batch_for_approval(batch, user, test):
    organisation = Organisation.objects.first()
    administration = user.user_access.administration
    complete_path = '{0}{1}'.format(administration.path, administration.id)
    complete_path = complete_path.split('.')[1:]
    randoms = Levels.objects.filter(level__gt=1).count()
    randoms = [n + 1 for n in range(randoms)]
    levels = Levels.objects.filter(
        level__lt=MAX_LEVEL_IN_SOURCE_FILE
    ).order_by('-level').all()
    administrations = Administration.objects.filter(
        id__in=complete_path,
        level__in=levels
    ).all()
    for administration in administrations:
        # check if approval assignment for the path is not available
        assignment = FormApprovalAssignment.objects.filter(
            form=batch.form, administration=administration).first()
        if not assignment:
            assignment = create_approver(
                form=batch.form,
                administration=administration,
                organisation=organisation,
            )
            if not test:
                last_name = "Admin" if administration.level.level == 1 \
                    else "Approver"
                print("Level: {} ({})".format(administration.level.level,
                                              administration.level.name))
                print(f"- Administration Name: {administration.name}")
                print("- Approver: {} ({})".format(assignment.user.email,
                                                   last_name))
        PendingDataApproval.objects.create(
            batch=batch,
            user=assignment.user,
            level=assignment.user.user_access.administration.level)


def print_info(form, administration, submitter, limit, test):
    if not test:
        print(f"Batch: {limit} datapoints\n")
        print(f"\nForm Name: {form.name}\n")
        print("\nSubmitter:")
        print(f"- Administration: {administration.full_name}")
        print("- Email: {}\n".format(submitter.email))


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("-r",
                            "--repeat",
                            nargs="?",
                            const=20,
                            default=5,
                            type=int)
        parser.add_argument("-b",
                            "--batch",
                            nargs="?",
                            const=1,
                            default=5,
                            type=int)
        parser.add_argument("-t",
                            "--test",
                            nargs="?",
                            const=1,
                            default=False,
                            type=bool)
        parser.add_argument("-e",
                            "--email",
                            nargs="?",
                            const=1,
                            default=None,
                            type=str)

    def handle(self, *args, **options):
        test = options.get("test")
        PendingDataApproval.objects.all().delete()
        PendingDataBatch.objects.all().delete()
        PendingFormData.objects.all().delete()
        fake_geo = pd.read_csv("./source/kenya_random_points.csv")
        forms = Forms.objects.filter(type=FormTypes.county).all()
        user = None
        if options.get('email'):
            # if user type is 'user' -> seed county form only
            try:
                user = SystemUser.objects.get(email=options.get('email'))
            except SystemUser.DoesNotExist:
                print('User with this {0} is not exists'.format(
                    options.get('email')))
                return
            if user.user_access.role == UserRoleTypes.user:
                forms = Forms.objects.filter(type=FormTypes.county)
            elif user.user_access.role == UserRoleTypes.admin:
                forms = Forms.objects.filter(type=FormTypes.national)
            else:
                print(
                    'User with this {0} is not allowed to submit data '.format(
                        options.get('email')))
                return
        for form in forms:
            submitter = None
            if user:
                submitter = user
            else:
                role = UserRoleTypes.admin
                if form.type == FormTypes.county:
                    role = UserRoleTypes.user
                submitter = create_or_get_submitter(role)
            seed_data(form, fake_geo, options.get("repeat"), submitter)
            administration = submitter.user_access.administration
            UserForms.objects.get_or_create(form=form, user=submitter)
            limit = options.get('batch')
            print_info(form, administration, submitter, limit, test)
            if limit:
                if form.type == FormTypes.county and not test:
                    print("Approvers:\n")
                while PendingFormData.objects.filter(batch__isnull=True,
                                                     form=form).count():
                    batch = PendingDataBatch.objects.create(
                        name=fake.catch_phrase(),
                        form=form,
                        administration=submitter.user_access.administration,
                        user=submitter,
                    )

                    objs = PendingFormData.objects.filter(batch__isnull=True,
                                                          form=form)[:limit]
                    for obj in objs:
                        obj.batch = batch
                    PendingFormData.objects.bulk_update(objs, fields=['batch'])
                    if form.type == FormTypes.county:
                        assign_batch_for_approval(batch, submitter, test)
