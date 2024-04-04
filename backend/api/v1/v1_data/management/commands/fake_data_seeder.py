from datetime import datetime, timedelta, time

import pandas as pd
from django.core.management import BaseCommand
from django.utils import timezone
from django.utils.timezone import make_aware

from faker import Faker

from api.v1.v1_data.models import FormData, Answers, PendingAnswers
from api.v1.v1_forms.constants import QuestionTypes, FormTypes, SubmissionTypes
from api.v1.v1_forms.models import Forms, UserForms
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Access, Administration, Levels
from api.v1.v1_users.models import SystemUser
from api.v1.v1_users.management.commands.fake_user_seeder import create_user
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


def add_fake_answers(data: FormData,
                     form_type=FormTypes.county,
                     pending=False):
    form = data.form
    meta_name = []
    for question in form.form_questions.all().order_by('question_group__order',
                                                       'order'):
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

        seed = True
        if question.dependency:
            for d in question.dependency:
                if not pending:
                    prev_answer = Answers.objects.filter(
                        data=data, question_id=d.get('id')).first()
                else:
                    prev_answer = PendingAnswers.objects.filter(
                        pending_data=data, question_id=d.get('id')).first()
                if prev_answer and prev_answer.options:
                    seed = False
                    for o in prev_answer.options:
                        if o in d.get("options"):
                            seed = True
        if seed:
            if not pending:
                Answers.objects.create(data=data,
                                       question=question,
                                       name=name,
                                       value=value,
                                       options=option,
                                       created_by=data.created_by)
            else:
                PendingAnswers.objects.create(
                    pending_data=data,
                    question=question,
                    name=name,
                    value=value,
                    options=option,
                    created_by=data.created_by
                )
    data.name = ' - '.join(meta_name) if \
        form_type != FormTypes.national else data.name
    data.save()


def get_created_by(administration, form):
    created_by = SystemUser.objects.filter(
        user_access__administration=administration.parent
    ).first()
    if not created_by:
        created_by = create_user(
            role=UserRoleTypes.approver,
            administration=administration.parent,
            random_password=False
        )
    UserForms.objects.get_or_create(form=form, user=created_by)
    return created_by


def seed_data(form, fake_geo, level_names, repeat, test):
    for i in range(repeat):
        now_date = datetime.now()
        start_date = now_date - timedelta(days=5 * 365)
        created = fake.date_between(start_date, now_date)
        created = datetime.combine(created, time.min)
        geo = fake_geo.iloc[i].to_dict()
        geo_value = [geo["X"], geo["Y"]]
        level_id = 1
        last_level = Levels.objects.order_by('-id').first()
        if not test:
            for level_name in level_names:
                level = level_name.split("_")
                administration = Administration.objects.filter(
                    parent_id=level_id,
                    level=Levels.objects.filter(level=level[1]).first(),
                    name=geo[level_name]).first()
                if form.type == FormTypes.national:
                    access_obj = Access.objects
                    access_super_admin = access_obj.filter(
                        role=UserRoleTypes.super_admin).first()
                    access_admin = access_obj.filter(
                        role=UserRoleTypes.admin).order_by('?').first()
                    for access in [access_super_admin, access_admin]:
                        administration = Administration.objects.filter(
                            pk=access.administration.id).first()
                        data_name = "{0} - {1}".format(
                            administration.name, created.strftime("%B %Y"))
                        national_data = FormData.objects.create(
                            name=data_name,
                            geo=geo_value,
                            form=form,
                            administration=administration,
                            created_by=access.user,
                            submission_type=SubmissionTypes.registration,
                        )
                        national_data.created = make_aware(created)
                        level_id = administration.id
                        national_data.save()
                        add_fake_answers(national_data, form.type)
                else:
                    if (
                        not administration or
                        administration.level.level != last_level.level
                    ):
                        administration = Administration.objects \
                            .filter(level=last_level) \
                            .order_by('?').first()
                    created_by = get_created_by(
                        administration=administration,
                        form=form
                    )
                    data = FormData.objects.create(
                        name=fake.pystr_format(),
                        geo=geo_value,
                        form=form,
                        administration=administration,
                        created_by=created_by,
                        submission_type=SubmissionTypes.registration,
                    )
                    data.created = make_aware(created)
                    level_id = administration.id
                    data.save_to_file
                    data.save()
                    add_fake_answers(data, form.type)
        else:
            administration = Administration.objects \
                .filter(level=last_level).order_by('?').first()
            created_by = get_created_by(
                administration=administration, form=form
            )
            test_data = FormData.objects.create(
                name=fake.pystr_format(),
                geo=geo_value,
                form=form,
                administration=administration,
                created_by=created_by
            )
            test_data.save_to_file
            test_data.save()
            add_fake_answers(test_data, form.type)


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
        fake_geo = pd.read_csv("./source/kenya_random_points-2024.csv")
        fake_geo = fake_geo.sample(frac=1).reset_index(drop=True)
        level_names = list(
            filter(lambda x: True if "NAME_" in x else False, list(fake_geo)))
        for form in Forms.objects.all():
            if not test:
                print(f"\nSeeding - {form.name}")
            seed_data(form, fake_geo, level_names, options.get("repeat"),
                      options.get("test"))
        refresh_materialized_data()
