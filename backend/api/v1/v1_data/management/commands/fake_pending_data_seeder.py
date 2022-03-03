from datetime import timedelta

import pandas as pd
from django.core.management import BaseCommand
from django.utils import timezone
from faker import Faker

from api.v1.v1_data.models import PendingFormData, \
    PendingAnswers, PendingDataApproval, PendingDataBatch
from api.v1.v1_forms.constants import QuestionTypes
from api.v1.v1_forms.models import Forms, FormApprovalAssignment
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Administration, Levels
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


def seed_data(form, fake_geo, repeat, test):
    admin_ids = list(
        FormApprovalAssignment.objects.values_list('administration_id',
                                                   flat=True).filter(
            form=form))
    for i in range(repeat):
        if test:
            administration = Administration.objects.filter(
                id__in=admin_ids).order_by(
                '?').first()
        else:
            administration = Administration.objects.filter(
                id__in=admin_ids,
                level=Levels.objects.order_by('-level').first()).order_by(
                '?').first()
        geo = fake_geo.iloc[i].to_dict()
        data = PendingFormData.objects.create(
            name=fake.pystr_format(),
            geo=[geo["X"], geo["Y"]],
            form=form,
            administration=administration,
            created_by=SystemUser.objects.filter(
                user_access__role=UserRoleTypes.user).order_by('?').first())

        complete_path = '{0}{1}'.format(administration.path, administration.id)

        for path in complete_path.split('.'):
            assignment = FormApprovalAssignment.objects.filter(
                form=form,
                administration_id=path).first()
            if assignment:
                PendingDataApproval.objects.create(
                    pending_data=data,
                    user=assignment.user,
                    level=assignment.user.user_access.administration.level
                )
        add_fake_answers(data)


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

    def handle(self, *args, **options):
        PendingFormData.objects.all().delete()
        PendingDataBatch.objects.all().delete()
        fake_geo = pd.read_csv("./source/kenya_random_points.csv")
        for form in Forms.objects.all():
            seed_data(form, fake_geo, options.get("repeat"),
                      options.get("test"))
            limit = options.get('batch')
            if limit:
                while PendingFormData.objects.filter(
                        batch__isnull=True, form=form).count() >= limit:
                    user = SystemUser.objects.filter(
                        user_access__role=UserRoleTypes.user).order_by(
                        '?').first()
                    batch = PendingDataBatch.objects.create(
                        name=fake.text(),
                        form=form,
                        administration=user.user_access.administration,
                        user=user,

                    )

                    objs = PendingFormData.objects.filter(
                        batch__isnull=True, form=form)[:limit]
                    for obj in objs:
                        obj.batch = batch
                    PendingFormData.objects.bulk_update(objs, fields=['batch'])
