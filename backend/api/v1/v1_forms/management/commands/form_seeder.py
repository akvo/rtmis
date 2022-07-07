import json
import os

from rtmis.settings import PROD
from django.core.management import BaseCommand
from django.core.cache import cache

from api.v1.v1_forms.constants import QuestionTypes, AttributeTypes
from api.v1.v1_forms.models import Forms
from api.v1.v1_data.functions import refresh_materialized_data
from api.v1.v1_forms.models import QuestionGroup as QG
from api.v1.v1_forms.models import Questions
from api.v1.v1_forms.models import QuestionOptions as QO
from api.v1.v1_forms.models import QuestionAttribute as QA


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("-t",
                            "--test",
                            nargs="?",
                            const=1,
                            default=False,
                            type=int)

    def handle(self, *args, **options):
        TEST = options.get("test")
        source_folder = './source/forms/'
        source_files = [
            f"{source_folder}{json_file}"
            for json_file in os.listdir(source_folder)
        ]
        source_files = list(
            filter(lambda x: "example" in x
                   if TEST else "example" not in x, source_files))
        if PROD:
            source_files = list(filter(lambda x: "prod" in x, source_files))
        for source in source_files:
            json_form = open(source, 'r')
            json_form = json.load(json_form)
            form = Forms.objects.filter(id=json_form["id"]).first()
            if not form:
                form = Forms.objects.create(id=json_form["id"],
                                            name=json_form["form"],
                                            version=1,
                                            type=json_form["type"])
                if not TEST:
                    self.stdout.write(
                        f"Form Created | {form.name} V{form.version}")
            else:
                form.name = json_form["form"]
                form.version += 1
                form.type = json_form["type"]
                form.save()
                if not TEST:
                    self.stdout.write(
                        f"Form Updated | {form.name} V{form.version}")
            for qg in json_form["question_groups"]:
                question_group, created = QG.objects.update_or_create(
                    name=qg["question_group"],
                    form=form,
                    defaults={
                        "name": qg["question_group"],
                        "form": form
                    })
                if created:
                    question_group.save()
                for qi, q in enumerate(qg["questions"]):
                    question = Questions.objects.filter(pk=q["id"]).first()
                    if not question:
                        question = Questions.objects.create(
                            id=q.get("id"),
                            name=q.get("name") or q.get("question"),
                            text=q["question"],
                            form=form,
                            order=qi + 1,
                            meta=q.get("meta"),
                            question_group=question_group,
                            rule=q.get("rule"),
                            required=q.get("required"),
                            dependency=q.get("dependency"),
                            type=getattr(QuestionTypes, q["type"]),
                        )
                    else:
                        question.name = q.get("name") or q.get("question")
                        question.text = q["question"]
                        question.order = qi + 1
                        question.meta = q.get("meta")
                        question.rule = q.get("rule")
                        question.required = q.get("required")
                        question.dependency = q.get("dependency")
                        question.type = getattr(QuestionTypes, q["type"])
                        question.save()
                    if q.get("options"):
                        QO.objects.filter(question=question).all().delete()
                        QO.objects.bulk_create([
                            QO(
                                name=o["name"].strip(),
                                question=question,
                                order=io + 1,
                            ) for io, o in enumerate(q.get("options"))
                        ])
                    if q.get("attributes"):
                        QA.objects.filter(question=question).all().delete()
                        QA.objects.bulk_create([
                            QA(
                                attribute=getattr(AttributeTypes, a),
                                question=question,
                            ) for a in q.get("attributes")
                        ])
        # DELETE CACHES AND REFRESH MATERIALIZED DATA
        cache.clear()
        refresh_materialized_data()
