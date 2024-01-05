import requests as r
import json
import pandas as pd

from django.core.management import BaseCommand

base_url = 'https://form-service.akvotest.org/api/form/'
forms = [
    {
        "id": 1699353915355,
        "name": "Households",
    },
    {
        "id": 1701757876668,
        "name": "Wash in Schools",
    },
    {
        "id": 1699354006503,
        "name": "Community",
    }
]
question_types = {'input': 'text', 'image': 'photo'}


def question_mapping(row):
    qs = pd.DataFrame(row[0])\
        .rename(columns={'name': 'question', 'option': 'options'})
    qs = qs.where(pd.notnull(qs), None)
    qs = qs.to_dict('records')
    qs = list(map(
        lambda q: {
            **q,
            'type': question_types.get(str(q['type'])) if question_types.get(
                str(q['type'])
            ) else q['type']
        }, qs))
    return qs


def generate_form(form_id: int, data: list):
    df = pd.json_normalize(data)
    df['type'] = 1
    df = df.rename(columns={
        'name': 'form',
        'question_group': 'question_groups'
    })
    df2 = pd.DataFrame(df['question_groups'][0])
    df2 = df2.rename(columns={
        'name': 'question_group',
        'question': 'questions'
    })
    df2['questions'] = pd.DataFrame(df2['questions'])\
        .apply(question_mapping, axis=1)
    qg = df2.to_dict('records')
    df['question_groups'] = df['question_groups'].apply(lambda x: qg)
    j = df.to_dict('records')[0]
    with open(f"./source/forms/{form_id}.prod.json", 'w') as f:
        json.dump(j, f)


class Command(BaseCommand):
    def handle(self, *args, **options):
        for form in forms:
            form_id = form['id']
            form_name = form['name']
            req = r.get(f"{base_url}{form_id}")
            generate_form(form_id=form_id, data=req.json())
            self.stdout.write(
                f"Form Downloaded | {form_id} {form_name}"
            )
