from api.v1.v1_data.models import Answers
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
