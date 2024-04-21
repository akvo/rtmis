from django.core.management import BaseCommand
from api.v1.v1_forms.models import Questions, QuestionOptions
from api.v1.v1_forms.constants import QuestionTypes
from api.v1.v1_data.models import (
    FormData,
    Answers,
    PendingAnswers,
    AnswerHistory,
    PendingAnswerHistory,
)


def set_answer_data(answers, option_labels, option_dict, model_name):
    for answer in answers:
        new_answer = []
        for answer_option in answer.options:
            if answer_option in option_labels:
                new_answer.append(option_dict[answer_option])
            else:
                print(f"NOT FOUND|{model_name}-{answer.id}|{answer_option}")
        if len(new_answer) == len(answer.options):
            answer.options = new_answer
            answer.save()


class Command(BaseCommand):
    def handle(self, *args, **options):
        questions = Questions.objects.filter(
            type__in=[QuestionTypes.option, QuestionTypes.multiple_option]
        ).values("id")
        for q in questions:
            options = QuestionOptions.objects.filter(question=q["id"]).values(
                "label", "value"
            )
            option_labels = [o["label"] for o in options]
            option_dict = {o["label"]: o["value"] for o in options}
            answers = Answers.objects.filter(question=q["id"]).all()
            answer_history = AnswerHistory.objects.filter(
                question=q["id"]
            ).all()
            pending_answers = PendingAnswers.objects.filter(
                question=q["id"]
            ).all()
            pending_answer_history = PendingAnswerHistory.objects.filter(
                question=q["id"]
            ).all()
            set_answer_data(answers, option_labels, option_dict, "Answers")
            set_answer_data(
                answer_history, option_labels, option_dict, "AnswerHistory"
            )
            set_answer_data(
                pending_answers, option_labels, option_dict, "PendingAnswers"
            )
            set_answer_data(
                pending_answer_history,
                option_labels,
                option_dict,
                "PendingAnswerHistory",
            )
        for data in FormData.objects.all():
            data.save_to_file
