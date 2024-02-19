import os
import pathlib

import pandas as pd

from api.v1.v1_forms.models import Forms, Questions
from api.v1.v1_profile.models import Administration, Levels
from api.v1.v1_users.models import SystemUser


def get_definition(form: Forms):
    questions = questions = Questions.objects.filter(form=form).order_by(
        "question_group__order", "order").all()
    framed = []
    indexer = 1
    for q in [qs.to_definition() for qs in questions]:
        rule = ""
        dependency = ""
        if q["rule"]:
            rule = []
            for r in q["rule"]:
                rtext = f"{r}: " + str(q["rule"][r])
                rule.append(rtext)
            rule = " ".join(rule)
        if q["dependency"]:
            dependency = []
            for d in q["dependency"]:
                did = d["id"]
                options = "|".join(d["options"])
                dtext = f"{did}: " + options
                dependency.append(dtext)
            dependency = "\n".join(dependency)
        if q["options"]:
            for o in q["options"]:
                framed.append({
                    "qg_id": q["qg_id"],
                    "order": q["order"],
                    "id": q["id"],
                    "variable": q["variable"],
                    "question": q["name"],
                    "type": q["type"],
                    "option": o,
                    "required": "YES" if q["required"] else "NO",
                    "rule": rule,
                    "dependency": dependency,
                    "indexer": indexer
                })
        else:
            framed.append({
                "qg_id": q["qg_id"],
                "order": q["order"],
                "id": q["id"],
                "variable": q["variable"],
                "question": q["name"],
                "type": q["type"],
                "option": "",
                "required": "YES" if q["required"] else "NO",
                "rule": rule,
                "dependency": dependency,
                "indexer": indexer
            })
        indexer += 1
    return framed


def generate_definition_sheet(form: Forms):
    definitions = get_definition(form=form)
    df = pd.DataFrame(definitions)
    selected_columns = [
        "indexer", "id", "variable", "question", "type", "required",
        "dependency", "option", "rule"]
    df = df[selected_columns]
    df = df.groupby(selected_columns).first()
    return df.droplevel('indexer')


def generate_excel(form: Forms, user: SystemUser):
    questions = questions = Questions.objects.filter(form=form).order_by(
        "question_group__order", "order").all()
    data = pd.DataFrame(
        columns=['{0}|{1}'.format(q.id, q.name) for q in questions], index=[0])
    form_name = form.name
    filename = f"{form.id}-{form_name}"
    directory = 'tmp'
    pathlib.Path(directory).mkdir(parents=True, exist_ok=True)
    filepath = f"./{directory}/{filename}.xlsx"
    if os.path.exists(filepath):
        os.remove(filepath)
    writer = pd.ExcelWriter(filepath, engine='xlsxwriter')
    data.to_excel(writer,
                  sheet_name='data',
                  startrow=1,
                  header=False,
                  index=False)
    workbook = writer.book
    worksheet = writer.sheets['data']
    header_format = workbook.add_format({
        'bold': True,
        'text_wrap': True,
        'valign': 'top',
        'border': 1
    })
    for col_num, value in enumerate(data.columns.values):
        worksheet.write(0, col_num, value, header_format)
    definitions = generate_definition_sheet(form=form)
    definitions.to_excel(writer, sheet_name='definitions', startrow=-1)

    administration = user.user_access.administration
    if administration.path:
        allowed_path = f"{administration.path}{administration.id}."
    else:
        allowed_path = f"{administration.id}."
    allowed_descendants = Administration.objects.filter(
        path__startswith=allowed_path,
        level=Levels.objects.order_by('-level').first()).order_by(
            'level__level')
    admins = []
    for descendant in allowed_descendants:
        parents = list(
            Administration.objects.filter(
                id__in=descendant.path.split('.')[:-1]).values_list(
                    'name', flat=True).order_by('level__level'))
        parents.append(descendant.name)
        admins.append('|'.join(parents))

    v = pd.DataFrame(admins)
    v.to_excel(writer,
               sheet_name='administration',
               startrow=-1,
               header=False,
               index=False)
    writer.save()
    return filepath
