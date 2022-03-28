import datetime
import enum
import itertools
import os
from string import ascii_uppercase

import pandas as pd

from api.v1.v1_forms.constants import QuestionTypes
from api.v1.v1_forms.models import Questions
from api.v1.v1_jobs.helper import ValidationText, HText
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
        answer = int(answer)
    except ValueError:
        return {"error_message": ValidationText.numeric_validation.value}
    if question.rule:
        rule = question.rule
        qname = question.name
        for r in rule:
            if r == "max" and rule[r] < answer:
                return {
                    "error_message":
                        ValidationText.numeric_max_rule.value.replace(
                            "--question--", qname).replace("--rule--",
                                                           str(rule[r]))
                }
            if r == "min" and rule[r] > answer:
                return {
                    "error_message":
                        ValidationText.numeric_min_rule.value.replace(
                            "--question--", qname).replace("--rule--",
                                                           str(rule[r]))
                }
    return False


def validate_geo(answer):
    answer = str(answer)
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
    aw = answer.split("|")
    name = adm["name"]
    if len(aw) < 2:
        return {
            "error_message": ValidationText.administration_validation.value
        }
    if aw[0] != adm["name"]:
        return {
            "error_message":
                f"{ValidationText.administration_not_valid.value} {name}"
        }
    children = Administration.objects.filter(name=aw[-1]).first()
    if not children:
        return {
            "error_message":
                ValidationText.administration_not_part_of.value.replace(
                    "--answer--", str(aw[-1])).replace("--administration--",
                                                       name)
        }
    return False


def validate_date(answer):
    try:
        answer = int(answer)
        return {
            "error_message":
                f"Invalid date format: {answer}. It should be YYYY-MM-DD"
        }
    except ValueError:
        pass
    try:
        answer = datetime.datetime.strptime(answer, "%Y-%m-%d")
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


def validate_row_data(col, answer, question, adm):
    default = {"error": ExcelError.value, "cell": col}
    if answer != answer:
        if question.required:
            default.update({
                "error_message":
                    f"{question.name} {ValidationText.is_required.value}"
            })
            return default
        return False
    if isinstance(answer, str):
        answer = HText(answer).clean
    if question.type == QuestionTypes.administration:
        err = validate_administration(answer, adm)
        if err:
            default.update(err)
            return default
    if question.type == QuestionTypes.geo:
        err = validate_geo(answer)
        if err:
            default.update(err)
            return default
    if question.type == QuestionTypes.number:
        err = validate_number(answer, question)
        if err:
            default.update(err)
            return default
    if question.type == QuestionTypes.date:
        err = validate_date(answer)
        if err:
            default.update(err)
            return default
    if question.type in [QuestionTypes.option, QuestionTypes.multiple_option]:
        err = validate_option(question.option, answer)
        if err:
            default.update(err)
            return default
    return False


def validate_sheet_name(file: str):
    xl = pd.ExcelFile(file)
    return xl.sheet_names


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

    # childs = crud_administration.get_all_childs(session=session,
    #                                             parents=[administration],
    #                                             current=[])
    adm = Administration.objects.get(id=administration)
    if adm.path:
        filter_path = '{0}{1}.'.format(adm.path,
                                       adm.id)
    else:
        filter_path = f"{adm.id}."
    childs = list(
        Administration.objects.filter(
            path__startswith=filter_path).values_list('id',
                                                      flat=True))

    adm = {"id": adm.id, "name": adm.name, "childs": childs}
    for col in excel_head:
        header = excel_head[col]
        error = validate_header_names(header, f"{col}1", header_names)
        if error:
            header_error.append(error)
        if not error:
            qid = header.split("|")[0]
            question = questions.filter(id == int(qid)).first()
            answers = list(df[header])
            for i, answer in enumerate(answers):
                ix = i + 2
                error = validate_row_data(f"{col}{ix}", answer,
                                          question, adm)
                if error:
                    data_error.append(error)
    return header_error + data_error
