from datetime import timedelta

from django.core.management import BaseCommand
from django.utils import timezone
from django.db.transaction import atomic
from faker import Faker

from api.v1.v1_forms.constants import QuestionTypes
from api.v1.v1_forms.models import Forms, FormData, Answers
from api.v1.v1_profile.models import Administration, Levels
from api.v1.v1_users.models import SystemUser

fake = Faker()


def add_fake_answers(data: FormData):
    form = data.form
    meta_name = []
    for question in form.form_questions.all().order_by('order'):
        name = None
        value = None
        option = None

        if question.type == QuestionTypes.geo:
            lat, lng = fake.latlng()
            option = [str(lat), str(lng)]
        elif question.type == QuestionTypes.administration:
            administration = Administration.objects.filter(
                level=Levels.objects.order_by('level').last().level).order_by(
                    '?').first()
            name = administration.name
            value = administration.id
        elif question.type == QuestionTypes.text:
            name = fake.company() if question.meta else fake.text(
                max_nb_chars=10)
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
        else:
            pass

        if question.meta:
            if name:
                meta_name.append(name)
            elif option and question.type != QuestionTypes.geo:
                meta_name.append(','.join(option))
            elif value:
                meta_name.append(value)
            else:
                pass

        name = name if question.type != QuestionTypes.administration else None
        Answers.objects.create(
            data=data,
            question=question,
            name=name,
            value=value,
            options=option,
            created_by=SystemUser.objects.order_by('?').first())
    data.name = ' - '.join(meta_name)
    data.save()


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("-r",
                            "--repeat",
                            nargs="?",
                            const=20,
                            default=20,
                            type=int)

    @atomic
    def handle(self, *args, **options):

        FormData.objects.all().delete()
        lat, lng = fake.latlng()
        geo = {'lat': str(lat), 'lng': str(lng)}
        for form in Forms.objects.all():
            print(f"{form.id} - {form.name}")
            data = FormData.objects.create(
                name=fake.pystr_format(),
                form=form,
                administration=Administration.objects.order_by('?').first(),
                geo=geo,
                created_by=SystemUser.objects.order_by('?').first())
            for i in range(options.get('repeat')):
                add_fake_answers(data)
