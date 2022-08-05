import datetime
import enum
import itertools
import math
import os
from string import ascii_uppercase

import pandas as pd

from api.v1.v1_data.models import FormData
from api.v1.v1_forms.constants import QuestionTypes
from api.v1.v1_forms.models import Questions
from api.v1.v1_jobs.functions import ValidationText, HText
from api.v1.v1_profile.models import Administration


class ExcelError(enum.Enum):
    sheet = 'sheet_name'
    header = 'header_name'
    value = 'column_value'


def generate_excel_columns():
    n = 1
    while True:
        yield from (''.join(group)
                    for group in itertools.product(ascii_uppercase, repeat=n))
        n += 1


def validate_header_names(header, col, header_names):
    default = {"error": ExcelError.header, "cell": col}
    if header == "data_id":
        return False
    if "Unnamed:" in header:
        default.update(
            {"error_message": ValidationText.header_name_missing.value})
        return default
    if "|" not in header:
        default.update({
            "error_message":
                f"{header} {ValidationText.header_no_question_id.value}",
        })
        return default
    if "|" in header:
        if header not in header_names:
            default.update({
                "error_message":
                    f"{header} {ValidationText.header_invalid_id.value}",
            })
            return default
    return False


def validate_number(answer, question):
    try:
        answer = float(answer)
    except ValueError:
        return {"error_message": ValidationText.numeric_validation.value}
    if question.rule:
        rule = question.rule
        qname = question.name
        for r in rule:
            if r == "allow_decimal" and not rule[r]:
                answer = int(float(answer))
            if r == "max" and float(rule[r]) < answer:
                return {
                    "error_message":
                        ValidationText.numeric_max_rule.value.replace(
                            "--question--", qname).replace("--rule--",
                                                           str(rule[r]))
                }
            if r == "min" and float(rule[r]) > answer:
                return {
                    "error_message":
                        ValidationText.numeric_min_rule.value.replace(
                            "--question--", qname).replace("--rule--",
                                                           str(rule[r]))
                }
    return False


def validate_geo(answer):
    answer = str(answer)
    answer = answer.strip().replace('|', ',')
    try:
        for a in answer.split(","):
            float(a.strip())
    except ValueError:
        return {"error_message": ValidationText.lat_long_validation.value}
    if "," not in answer:
        return {"error_message": ValidationText.lat_long_validation.value}
    answer = answer.split(",")
    if len(answer) != 2:
        return {"error_message": ValidationText.lat_long_validation.value}
    for a in answer:
        try:
            a = float(a.strip())
        except ValueError:
            return {"error_message": ValidationText.lat_long_validation.value}
    return False


def validate_administration(answer, adm):
    if adm['id'] == 1:
        return False
    aw = answer.split("|")
    name = adm["name"]
    if len(aw) < 2:
        return {
            "error_message": ValidationText.administration_validation.value
        }
    path = []
    for i, a in enumerate(aw):
        if not i:
            administration = Administration.objects.filter(name=a).first()
        else:
            administration = Administration.objects.filter(
                name=a, parent_id=path[-1]).first()
        path.append(administration.id)

    if adm['id'] not in path:
        return {
            "error_message":
                ValidationText.administration_not_part_of.value.replace(
                    "--answer--", str(aw[-1])).replace("--administration--",
                                                       name)
        }
    return False


def validate_date(answer):
    try:
        answer = datetime.datetime.strptime(str(answer), "%Y-%m-%d")
    except ValueError:
        return {
            "error_message":
                f"Invalid date format: {answer}. It should be YYYY-MM-DD"
        }
    return False


def validate_option(options, answer):
    options = [o.name for o in options]
    lower_options = [o.lower() for o in options]
    answer = answer.split("|")
    invalid_value = []
    invalid_case = []
    invalid = False
    for a in answer:
        if a not in options and a.lower() not in lower_options:
            invalid = True
            invalid_value.append(a)
        if a not in options and a.lower() in lower_options:
            invalid = True
            invalid_case.append(a)
    if invalid:
        message = ""
        if len(invalid_case):
            invalid_list = ", ".join(invalid_case)
            message += f"Invalid case: {invalid_list}"
        if len(invalid_case) and len(invalid_value):
            message += " and "
        if len(invalid_value):
            invalid_list = ", ".join(invalid_value)
            message += f"Invalid value: {invalid_list}"
        return {"error_message": message}
    return False


def validate_row_data(col, answer, question: Questions, adm):
    default = {"error": ExcelError.value, "cell": col}
    if answer != answer:
        # if question.required:
        #     default.update({
        #         "error_message":
        #             f"{question.name} {ValidationText.is_required.value}"
        #     })
        #     return default
        return False
    if isinstance(answer, str):
        answer = HText(answer).clean
    if question.type == QuestionTypes.administration:
        err = validate_administration(answer, adm)
        if err:
            default.update(err)
            return default
    elif question.type == QuestionTypes.geo:
        err = validate_geo(answer)
        if err:
            default.update(err)
            return default
    elif question.type == QuestionTypes.number:
        err = validate_number(answer, question)
        if err:
            default.update(err)
            return default
    elif question.type == QuestionTypes.date:
        err = validate_date(answer)
        if err:
            default.update(err)
            return default
    elif question.type in [QuestionTypes.option,
                           QuestionTypes.multiple_option]:
        err = validate_option(question.question_question_options.all(), answer)
        if err:
            default.update(err)
            return default
    else:
        pass
    return False


def validate_sheet_name(file: str):
    xl = pd.ExcelFile(file)
    return xl.sheet_names


def validate_data_id(col, data_id):
    default = {"error": ExcelError.value, "cell": col}
    if data_id and not FormData.objects.filter(id=data_id).exists():
        default.update({
            "error_message": ValidationText.invalid_data_id.value.replace(
                "--data_id--", str(data_id))
        })
        return default
    return False


def validate(form: int, administration: int, file: str):
    sheet_names = validate_sheet_name(file)
    template_sheets = ['data', 'definitions', 'administration']
    TESTING = os.environ.get("TESTING")
    if TESTING:
        template_sheets = ['data']
    for sheet_tab in template_sheets:
        if sheet_tab not in sheet_names:
            return [{
                "error": ExcelError.sheet,
                "error_message": ValidationText.template_validation.value,
                "sheets": ",".join(sheet_names)
            }]
    questions = Questions.objects.filter(form_id=form)
    header_names = [q.to_excel_header for q in questions]
    df = pd.read_excel(file, sheet_name='data')
    if 'id' in list(df):
        df = df.rename(columns={'id': 'data_id'})
    if df.shape[0] == 0:
        return [{
            "error": ExcelError.sheet,
            "error_message": ValidationText.file_empty_validation.value,
        }]
    excel_head = {}
    excel_cols = list(itertools.islice(generate_excel_columns(), df.shape[1]))
    for index, header in enumerate(list(df)):
        excel_head.update({excel_cols[index]: header})
    header_error = []
    data_error = []

    adm = Administration.objects.get(id=administration)

    adm = {"id": adm.id, "name": adm.name}
    for col in excel_head:
        header = excel_head[col]
        errors = None
        if header not in header_names + ['data_id']:
            errors = validate_header_names(header, f"{col}1", header_names)
        if errors:
            header_error.append(errors)
        if not errors:
            if header == 'data_id':
                data_ids = list(df[header])
                for i, data_id in enumerate(data_ids):
                    ix = i + 2
                    data_id = None if math.isnan(data_id) else data_id
                    errors = validate_data_id(f"{col}{ix}", data_id)
                    if errors:
                        data_error.append(errors)
            else:
                qid = header.split("|")[0]
                question = questions.filter(id=int(qid)).first()
                answers = list(df[header])
                for i, answer in enumerate(answers):
                    ix = i + 2
                    errors = validate_row_data(
                        f"{col}{ix}", answer, question, adm)
                    if errors:
                        data_error.append(errors)
    return header_error + data_error
