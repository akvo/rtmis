from time import sleep

from api.v1.v1_data.models import Answers
from api.v1.v1_forms.constants import QuestionTypes
from api.v1.v1_users.models import SystemUser


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


def demo_q_func(user_id):
    sleep(10)
    print(user_id)
    return {'name': SystemUser.objects.get(pk=user_id).get_full_name()}


def demo_q_response_func(task):
    print('Result', task.result)
