import json
import os

from django.core.management import BaseCommand

from api.v1.v1_forms.constants import QuestionTypes, FormTypes
from api.v1.v1_forms.models import Forms, QuestionGroup
from api.v1.v1_forms.models import Questions, QuestionOptions

source_folder = './source/forms/'
source_files = [
    f"{source_folder}{json_file}" for json_file in os.listdir(source_folder)
]


class Command(BaseCommand):
    def handle(self, *args, **options):
        Forms.objects.all().delete()
        for source in source_files:
            json_form = open(source, 'r')
            json_form = json.load(json_form)
            form = Forms(id=json_form["id"],
                         name=json_form["form"],
                         version=1,
                         type=FormTypes.national)
            form.save()
            for qg in json_form["question_groups"]:
                question_group = QuestionGroup(name=qg["question_group"],
                                               form=form)
                question_group.save()
                for q in qg["questions"]:
                    question = Questions.objects.create(
                        id=q.get("id"),
                        name=q["question"],
                        text=q["question"],
                        order=q["order"],
                        meta=q["meta"],
                        form=form,
                        question_group=question_group,
                        rule=q.get("rule"),
                        required=q.get("required"),
                        dependency=q.get("dependency"),
                        type=getattr(QuestionTypes, q["type"]))
                    if q.get("options"):
                        question.question_question_options.bulk_create([
                            QuestionOptions(question=question, name=o["name"])
                            for o in q["options"]
                        ])
            print(f"Form Created | {form.name}")
