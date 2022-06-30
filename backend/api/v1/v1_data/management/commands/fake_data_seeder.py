from datetime import timedelta

import pandas as pd
from django.core.management import BaseCommand
from django.utils import timezone
from faker import Faker

from api.v1.v1_data.models import FormData, Answers
from api.v1.v1_forms.constants import QuestionTypes
from api.v1.v1_forms.models import Forms
from api.v1.v1_profile.models import Administration, Levels
from api.v1.v1_users.models import SystemUser
from api.v1.v1_data.functions import refresh_materialized_data

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
            date_end=timezone.datetime.now().date()).strftime("%m/%d/%Y")
    else:
        pass
    return name, value, option


def add_fake_answers(data: FormData):
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

        Answers.objects.create(
            data=data,
            question=question,
            name=name,
            value=value,
            options=option,
            created_by=SystemUser.objects.order_by('?').first())
    data.name = ' - '.join(meta_name)
    data.save()


def seed_data(form, fake_geo, level_names, repeat, test):
    for i in range(repeat):
        geo = fake_geo.iloc[i].to_dict()
        data = FormData.objects.create(
            name=fake.pystr_format(),
            geo=[geo["X"], geo["Y"]],
            form=form,
            administration=Administration.objects.first(),
            created_by=SystemUser.objects.order_by('?').first())
        level_id = 1
        if not test:
            for level_name in level_names:
                level = level_name.split("_")
                administration = Administration.objects.filter(
                    parent_id=level_id,
                    level=Levels.objects.filter(level=level[1]).first(),
                    name=geo[level_name]).first()
                level_id = administration.id
                data.administration = administration
                data.save()
        else:
            level = Levels.objects.order_by('-id').first()
            data.administration = Administration.objects.filter(
                level=level).order_by('?').first()
            data.save()
        add_fake_answers(data)


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
        FormData.objects.all().delete()
        fake_geo = pd.read_csv("./source/kenya_random_points.csv")
        level_names = list(
            filter(lambda x: True if "NAME_" in x else False, list(fake_geo)))
        for form in Forms.objects.all():
            if not test:
                print(f"\nSeeding - {form.name}")
            seed_data(form, fake_geo, level_names, options.get("repeat"),
                      options.get("test"))
        refresh_materialized_data()
