from api.v1.v1_data.models import Answers, AnswerHistory
from api.v1.v1_forms.constants import QuestionTypes


def update_date_time_format(date):
    if date:
        # date = timezone.datetime.strptime(date, "%Y-%m-%d").date()
        return date.date().strftime('%B %d, %Y')
    return None


def get_answer_value(answer: Answers):
    if answer.question.type in [QuestionTypes.geo, QuestionTypes.option,
                                QuestionTypes.multiple_option]:
        return answer.options
    elif answer.question.type in [QuestionTypes.administration,
                                  QuestionTypes.number]:
        return answer.value
    else:
        return answer.name


def get_answer_history(answer_history: AnswerHistory):
    value = None
    created = update_date_time_format(answer_history.created)
    created_by = answer_history.created_by.get_full_name()
    if answer_history.question.type in [QuestionTypes.geo,
                                        QuestionTypes.option,
                                        QuestionTypes.multiple_option]:
        value = answer_history.options
    elif answer_history.question.type in [QuestionTypes.administration,
                                          QuestionTypes.number]:
        value = answer_history.value
    else:
        value = answer_history.name
    return {"value": value, "created": created, "created_by": created_by}
