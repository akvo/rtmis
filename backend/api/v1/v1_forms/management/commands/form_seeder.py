import os
import json
from django.core.management import BaseCommand
from api.v1.v1_forms.models import Forms, Questions, QuestionGroup
from api.v1.v1_forms.constants import QuestionTypes, FormTypes

source_folder = './source/forms/'
source_files = [
    f"{source_folder}{json_file}" for json_file in os.listdir(source_folder)
]


class Command(BaseCommand):
    def handle(self, *args, **options):
        for source in source_files:
            json_form = open(source, 'r')
            json_form = json.load(json_form)
            form, ok = Forms.objects.update_or_create(
                id=json_form["id"],
                name=json_form["form"],
                version=1,
                type=FormTypes.national,
                defaults={'id': json_form["id"]})
            print("{} ({})".format(form.name, "Created" if ok else "Updated"))
            for qg in json_form["question_groups"]:
                question_group, _ = QuestionGroup.objects.update_or_create(
                    name=qg["question_group"],
                    form=form,
                    defaults={
                        'name': qg["question_group"],
                        'form': form
                    })
                print(f"- {question_group.name}")
                for iq, q in enumerate(qg["questions"]):
                    id = q["id"] if "id" in q else int(form.id) + iq
                    question, _ = Questions.objects.update_or_create(
                        id=id,
                        name=q["question"],
                        text=q["question"],
                        form=form,
                        question_group=question_group,
                        rule=q["rule"] if "rule" in q else None,
                        required=q["required"] if "required" in q else None,
                        dependency=q["dependency"]
                        if "dependency" in q else None,
                        type=getattr(QuestionTypes, q["type"]),
                        defaults={
                            'id': id,
                            'form': form,
                            'question_group': question_group
                        })
