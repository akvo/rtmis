from django.utils import timezone
from api.v1.v1_data.models import FormData, Answers, \
    PendingAnswers, AnswerHistory


def seed_approved_data(data):
    if data.data:
        form_data: FormData = data.data
        form_data.name = data.name
        form_data.form = data.form
        form_data.administration = data.administration
        form_data.geo = data.geo
        form_data.updated_by = data.created_by
        form_data.updated = timezone.now()
        form_data.save()

        for answer in data.pending_data_answer.all():
            form_answer = Answers.objects.get(data=form_data,
                                              question=answer.question)

            AnswerHistory.objects.create(data=form_answer.data,
                                         question=form_answer.question,
                                         name=form_answer.name,
                                         value=form_answer.value,
                                         options=form_answer.options,
                                         created_by=form_answer.created_by)
            form_answer.delete()

    else:
        form_data = FormData.objects.create(
            name=data.name,
            form=data.form,
            administration=data.administration,
            geo=data.geo,
            created_by=data.created_by,
        )
        data.data = form_data
        data.approved = True
        data.save()

    answer: PendingAnswers
    for answer in data.pending_data_answer.all():
        Answers.objects.create(
            data=form_data,
            question=answer.question,
            name=answer.name,
            value=answer.value,
            options=answer.options,
            created_by=answer.created_by,
        )
