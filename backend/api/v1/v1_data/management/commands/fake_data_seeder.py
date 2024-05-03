from datetime import datetime, timedelta, time

import pandas as pd
from django.core.management import BaseCommand
from django.utils import timezone
from django.utils.timezone import make_aware

from faker import Faker

from api.v1.v1_data.models import FormData, Answers, PendingAnswers
from api.v1.v1_forms.constants import QuestionTypes, FormTypes, SubmissionTypes
from api.v1.v1_forms.models import Forms, UserForms, FormApprovalAssignment
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Access, Administration
from api.v1.v1_users.models import SystemUser
from api.v1.v1_mobile.models import MobileAssignment
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
        value = data.administration.id
    elif question.type == QuestionTypes.text:
        name = fake.company() if question.meta else fake.sentence(nb_words=3)
    elif question.type == QuestionTypes.number:
        value = fake.random_int(min=10, max=50)
    elif question.type == QuestionTypes.option:
        option = [question.options.order_by("?").first().value]
        if (
            question.default_value and
            "submission_type" in question.default_value
        ):
            st_value = SubmissionTypes.FieldStr.get(
                data.submission_type
            ).lower()
            if st_value in question.default_value["submission_type"]:
                option = [
                    question.default_value["submission_type"][st_value]
                ]

    elif question.type == QuestionTypes.multiple_option:
        option = list(
            question.options.order_by("?").values_list("value", flat=True)[
                0: fake.random_int(min=1, max=3)
            ]
        )
    elif question.type == QuestionTypes.photo:
        name = fake.image_url()
    elif question.type == QuestionTypes.date:
        name = fake.date_between_dates(
            date_start=timezone.datetime.now().date() - timedelta(days=90),
            date_end=timezone.datetime.now().date(),
        ).strftime("%m/%d/%Y")
    else:
        pass
    return name, value, option


def add_fake_answers(
    data: FormData, form_type=FormTypes.county, pending=False
):
    form = data.form
    meta_name = []
    for question in form.form_questions.all().order_by(
        "question_group__order", "order"
    ):
        name, value, option = set_answer_data(data, question)
        if question.meta:
            if name:
                meta_name.append(name)
            elif option and question.type != QuestionTypes.geo:
                meta_name.append(",".join(option))
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
                        data=data, question_id=d.get("id")
                    ).first()
                else:
                    prev_answer = PendingAnswers.objects.filter(
                        pending_data=data, question_id=d.get("id")
                    ).first()
                if prev_answer and prev_answer.options:
                    seed = False
                    for o in prev_answer.options:
                        if o in d.get("options"):
                            seed = True
        if seed:
            if not pending:
                Answers.objects.create(
                    data=data,
                    question=question,
                    name=name,
                    value=value,
                    options=option,
                    created_by=data.created_by,
                )
            else:
                PendingAnswers.objects.create(
                    pending_data=data,
                    question=question,
                    name=name,
                    value=value,
                    options=option,
                    created_by=data.created_by,
                )
    if data.submission_type == SubmissionTypes.registration:
        data.name = (
            " - ".join(meta_name)
            if form_type != FormTypes.national else data.name
        )
    data.save()


def get_mobile_user(user, form):
    mobile_user = user.mobile_assignments.filter(
        forms__id__in=[form.pk]
    ).first()
    if not mobile_user:
        mobile_user = MobileAssignment.objects.create_assignment(
            user=user, name=fake.user_name()
        )
        mobile_user.forms.add(form)
        user_path = "{0}{1}".format(
            user.user_access.administration.path,
            user.user_access.administration.id
        )
        mobile_adms = form.form_form_data.filter(
            administration__path__startswith=user_path
        ).values_list("administration", flat=True)
        if len(mobile_adms) == 0:
            mobile_adms = user.user_access \
                .administration \
                .parent_administration.order_by('?')[:6]
        mobile_user.administrations.set(mobile_adms)
    return mobile_user


def seed_national_data(form, fake_geo, created, repeat):
    for i in range(repeat):
        geo = fake_geo.iloc[i].to_dict()
        geo_value = [geo["X"], geo["Y"]]
        access_obj = Access.objects

        access_admin = (
            access_obj.filter(role=UserRoleTypes.admin)
            .order_by("?")
            .first()
        )
        if access_admin:
            administration = Administration.objects.filter(
                pk=access_admin.administration.id
            ).first()
            data_name = "{0} - {1}".format(
                administration.name, created.strftime("%B %Y")
            )
            UserForms.objects.get_or_create(
                form=form,
                user=access_admin.user
            )
            national_data = FormData.objects.create(
                name=data_name,
                geo=geo_value,
                form=form,
                administration=administration,
                created_by=access_admin.user,
                submission_type=SubmissionTypes.registration,
            )
            national_data.created = make_aware(created)
            national_data.save()
            add_fake_answers(national_data, form.type)
            national_data.save_to_file


def seed_county_data(
    form,
    fake_geo,
    created,
    administration,
    repeat
):
    for i in range(repeat):
        geo = fake_geo.iloc[i].to_dict()
        geo_value = [geo["X"], geo["Y"]]
        assignment = FormApprovalAssignment.objects.filter(
            form=form,
            administration=administration,
        ).first()
        if assignment:
            user = SystemUser.objects.filter(
                user_form__form_id__in=[form.pk],
                user_access__administration=administration,
                user_access__role=UserRoleTypes.user
            ).order_by('?').first()
            if not user:
                user = create_user(
                    role=UserRoleTypes.user,
                    administration=administration,
                    random_password=False,
                )
                UserForms.objects.get_or_create(
                    form=form, user=user
                )
            mobile_user = get_mobile_user(
                user=user, form=form
            )
            created_by = mobile_user.user
            adm_submission = mobile_user.administrations.order_by('?').first()
            data = FormData.objects.create(
                name=fake.pystr_format(),
                geo=geo_value,
                form=form,
                administration=adm_submission,
                created_by=created_by,
                submission_type=SubmissionTypes.registration,
            )
            data.created = make_aware(created)
            data.save()
            add_fake_answers(data, form.type)
            data.save_to_file


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "-r", "--repeat", nargs="?", const=5, default=5, type=int
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
        now_date = datetime.now()
        start_date = now_date - timedelta(days=5 * 365)
        created = fake.date_between(start_date, now_date)
        created = datetime.combine(created, time.min)
        counties = (
            Administration.objects.filter(level__name="County")
            .distinct("name")
            .all()
        )
        for county in counties:
            county_user = SystemUser.objects.filter(
                user_access__administration=county
            ).order_by('?').first()
            if not county_user:
                create_user(
                    role=UserRoleTypes.admin,
                    administration=county,
                    random_password=False
                )
        for form in Forms.objects.all():
            if not test:
                print(f"Seeding - {form.name}")
            if form.type == FormTypes.national:
                seed_national_data(
                    form=form,
                    fake_geo=fake_geo,
                    created=created,
                    repeat=repeat,
                )
            else:
                administrations = [
                    ward
                    for county in counties
                    for subcounty in county.parent_administration.all()
                    for ward in subcounty.parent_administration.all()
                ]
                for adm in administrations:
                    seed_county_data(
                        form=form,
                        fake_geo=fake_geo,
                        created=created,
                        administration=adm,
                        repeat=repeat
                    )
        refresh_materialized_data()
