import os
import pathlib

import pandas as pd

from api.v1.v1_forms.models import Forms, Questions
from api.v1.v1_users.models import SystemUser


def get_definition(form: Forms):
    questions = (
        Questions.objects.filter(form=form)
        .order_by("question_group__order", "order")
        .all()
    )
    framed = []
    for i, q in enumerate([qs.to_definition() for qs in questions]):
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
                did = Questions.objects.get(pk=d["id"]).name
                if d.get("options"):
                    options = "|".join(d["options"])
                    dtext = f"{did}: " + options
                    dependency.append(dtext)
                if d.get("min"):
                    dtext = f"{did}: higher than {d['min']}"
                    dependency.append(dtext)
                if d.get("max"):
                    dtext = f"{did}: lower than {d['max']}"
                    dependency.append(dtext)
            dependency = "\n".join(dependency)
        if q["options"]:
            for o in q["options"]:
                framed.append(
                    {
                        "qg_id": q["qg_id"],
                        "order": q["order"],
                        "id": q["id"],
                        "name": q["name"],
                        "label": q["label"],
                        "type": q["type"],
                        "option": o["value"],
                        "option_label": o["label"],
                        "required": "YES" if q["required"] else "NO",
                        "rule": rule,
                        "dependency": dependency,
                        "indexer": i + 1,
                    }
                )
        else:
            framed.append(
                {
                    "qg_id": q["qg_id"],
                    "order": q["order"],
                    "id": q["id"],
                    "name": q["name"],
                    "label": q["label"],
                    "type": q["type"],
                    "option": None,
                    "option_label": None,
                    "required": "YES" if q["required"] else "NO",
                    "rule": rule,
                    "dependency": dependency,
                    "indexer": i + 1,
                }
            )
    return framed


def generate_definition_sheet(form: Forms, writer: pd.ExcelWriter):
    definitions = get_definition(form=form)
    df = pd.DataFrame(definitions)
    question_columns = [
        "name",
        "label",
        "type",
        "required",
        "rule",
        "dependency",
    ]
    df_questions = df[question_columns]
    df_questions.to_excel(writer, sheet_name="questions", index=False)
    df_options = df[["name", "option", "option_label"]]
    df_options = df_options.dropna(subset=["option"])
    df_options = df_options.drop_duplicates()
    df_options = df_options.rename(
        columns={
            "name": "question",
            "option": "option",
            "option_label": "label",
        }
    )
    df_options.to_excel(writer, sheet_name="options", index=False)


def generate_excel(form: Forms, user: SystemUser):
    questions = questions = (
        Questions.objects.filter(form=form)
        .order_by("question_group__order", "order")
        .all()
    )
    data = pd.DataFrame(
        columns=["{0}|{1}".format(q.id, q.name) for q in questions], index=[0]
    )
    form_name = form.name
    filename = f"{form.id}-{form_name}"
    directory = "tmp"
    pathlib.Path(directory).mkdir(parents=True, exist_ok=True)
    filepath = f"./{directory}/{filename}.xlsx"
    if os.path.exists(filepath):
        os.remove(filepath)
    writer = pd.ExcelWriter(filepath, engine="xlsxwriter")
    data.to_excel(
        writer, sheet_name="data", startrow=1, header=False, index=False
    )
    workbook = writer.book
    worksheet = writer.sheets["data"]
    header_format = workbook.add_format(
        {"bold": True, "text_wrap": True, "valign": "top", "border": 1}
    )
    for col_num, value in enumerate(data.columns.values):
        worksheet.write(0, col_num, value, header_format)
    generate_definition_sheet(form=form, writer=writer)
    writer.save()
    return filepath
