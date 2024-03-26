from django.utils import timezone
from api.v1.v1_data.models import Answers, AnswerHistory
from api.v1.v1_forms.constants import QuestionTypes


def update_date_time_format(date):
    if date:
        # date = timezone.datetime.strptime(date, "%Y-%m-%d").date()
        if not timezone.is_naive(date):
            return timezone.localtime(date).strftime("%Y-%m-%d %I:%M %p")
        return date.strftime("%Y-%m-%d %I:%M %p")
    return None


def get_answer_value(answer: Answers):
    if answer.question.type in [QuestionTypes.geo, QuestionTypes.option,
                                QuestionTypes.multiple_option]:
        return answer.options
    elif answer.question.type == QuestionTypes.number:
        return answer.value
    elif answer.question.type == QuestionTypes.administration:
        return int(float(answer.value)) if answer.value else None
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
    elif answer_history.question.type == QuestionTypes.number:
        value = answer_history.value
    elif answer_history.question.type == QuestionTypes.administration:
        value = int(float(answer_history.value))
    else:
        value = answer_history.name
    return {"value": value, "created": created, "created_by": created_by}
