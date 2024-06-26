import requests as r
import json
import pandas as pd
import re

from django.core.management import BaseCommand

base_url = 'https://form-service.akvotest.org/api/form/'
forms = [
    {
        "id": 1701757876668,
        "name": "RTMIS School WASH Form",
    },
]
question_types = {'input': 'text', 'image': 'photo'}


def to_snake_case(s):
    # Remove special characters (except underscore and space)
    s = re.sub(r'[^\w\s]', '', s)
    # Replace whitespace and hyphens with underscores
    s = re.sub(r'[\s-]+', '_', s)
    # Convert camelCase to snake_case
    s = re.sub(r'(?<!^)(?=[A-Z])', '_', s).lower()
    # Ensure no double underscores
    s = re.sub(r'_+', '_', s)
    return s


def option_mapping(row):
    if row[0] != row[0]:
        return row[0]
    options = [
        {
            'value': r.get(
                'value',
                r.get('code', to_snake_case(r.get('name')))
            ),
            'label': r.get('label', r.get('name')),
            **{
                k: v for k, v in r.items()
                if k not in ['value', 'label', 'code', 'name']
            }
        }
        for r in row[0]
    ]
    return options


def question_mapping(row):
    qs = pd.DataFrame(row[0])\
        .rename(columns={'option': 'options'})

    if 'label' not in qs.columns:
        qs.insert(2, 'label', qs['name'])
        qs['name'] = qs['name'].apply(to_snake_case)

    if 'options' in qs.columns:
        qs['options'] = pd.DataFrame(qs['options']).apply(
            option_mapping, axis=1
        )

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


def generate_form(form_id: int, data: list, test: bool = False):
    df = pd.json_normalize(data)
    df['type'] = 1
    df = df.rename(columns={
        'name': 'form',
        'question_group': 'question_groups'
    })
    df2 = pd.DataFrame(df['question_groups'][0])
    df2 = df2.rename(columns={
        'question': 'questions'
    })
    if 'label' not in df2.columns:
        df2.insert(2, 'label', df2['name'])
        df2['name'] = df2['name'].apply(to_snake_case)

    df2['questions'] = pd.DataFrame(df2['questions'])\
        .apply(question_mapping, axis=1)
    qg = df2.to_dict('records')
    df['question_groups'] = df['question_groups'].apply(lambda x: qg)
    j = df.to_dict('records')[0]
    if not test:
        with open(f"./source/forms/{form_id}.prod.json", 'w') as f:
            json.dump(j, f)


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
        for form in forms:
            form_id = form['id']
            form_name = form['name']
            req = r.get(f"{base_url}{form_id}")
            generate_form(form_id=form_id, data=req.json(), test=TEST)
            self.stdout.write(
                f"Form Downloaded | {form_id} {form_name}"
            )
