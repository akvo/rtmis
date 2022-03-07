from datetime import timedelta

import pandas as pd
from django.core.management import BaseCommand
from django.utils import timezone
from faker import Faker

from api.v1.v1_data.models import PendingFormData, \
    PendingAnswers, PendingDataApproval, PendingDataBatch
from api.v1.v1_forms.constants import QuestionTypes, FormTypes
from api.v1.v1_forms.models import Forms, FormApprovalAssignment
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Access
from api.v1.v1_users.models import SystemUser

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
            question.question_question_options.order_by('?').first().name
        ]
    elif question.type == QuestionTypes.multiple_option:
        option = list(
            question.question_question_options.order_by('?').values_list(
                'name', flat=True)[0:fake.random_int(min=1, max=3)])
    elif question.type == QuestionTypes.photo:
        name = fake.image_url()
    elif question.type == QuestionTypes.date:
        name = fake.date_between_dates(
            date_start=timezone.datetime.now().date() - timedelta(days=90),
            date_end=timezone.datetime.now().date())
    elif question.type == QuestionTypes.date:
        name = fake.date_between_dates(
            date_start=timezone.datetime.now().date() - timedelta(days=90),
            date_end=timezone.datetime.now().date())
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


def seed_data(form, fake_geo, repeat, created_by, test):
    for i in range(repeat):
        administration = created_by.user_access.administration
        geo = fake_geo.iloc[i].to_dict()
        data = PendingFormData.objects.create(name=fake.pystr_format(),
                                              geo=[geo["X"], geo["Y"]],
                                              form=form,
                                              administration=administration,
                                              created_by=created_by)

        add_fake_answers(data)


def assign_batch_for_approval(batch, user):
    administration = user.user_access.administration
    complete_path = '{0}{1}'.format(
        administration.path, administration.id)
    for path in complete_path.split('.')[1:]:
        assignment = FormApprovalAssignment.objects.filter(
            form=batch.form, administration_id=path).first()
        if not assignment:
            profile = fake.profile()
            name = profile.get("name").split(" ")
            approver = SystemUser.objects.create_user(
                email=profile.get("mail"),
                password="Test105",
                first_name=name[0],
                last_name=name[1])
            Access.objects.create(user=approver,
                                  role=UserRoleTypes.approver,
                                  administration_id=path)
            assignment = FormApprovalAssignment.objects.create(
                form=batch.form, administration_id=path, user=approver)
        PendingDataApproval.objects.create(
            batch=batch,
            user=assignment.user,
            level=assignment.user.user_access.administration.level)


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
        PendingDataApproval.objects.all().delete()
        PendingDataBatch.objects.all().delete()
        PendingFormData.objects.all().delete()
        fake_geo = pd.read_csv("./source/kenya_random_points.csv")
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
        else:
            forms = Forms.objects.all()

        for form in forms:
            if not user:
                role = UserRoleTypes.user \
                    if form.type == FormTypes.county else UserRoleTypes.admin
                user = SystemUser.objects.filter(
                    user_access__role=role).order_by('?').first()
            seed_data(form, fake_geo, options.get("repeat"), user,
                      options.get("test"))
            limit = options.get('batch')
            if limit:
                while PendingFormData.objects.filter(
                        batch__isnull=True, form=form).count() >= limit:
                    batch = PendingDataBatch.objects.create(
                        name=fake.text(),
                        form=form,
                        administration=user.user_access.administration,
                        user=user,
                    )

                    objs = PendingFormData.objects.filter(batch__isnull=True,
                                                          form=form)[:limit]
                    for obj in objs:
                        obj.batch = batch
                    PendingFormData.objects.bulk_update(objs, fields=['batch'])
                    if form.type == FormTypes.county:
                        assign_batch_for_approval(batch, user)
