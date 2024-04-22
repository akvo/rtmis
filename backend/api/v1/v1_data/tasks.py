from django.utils import timezone
from api.v1.v1_data.models import (
    FormData,
    Answers,
    PendingAnswers,
    AnswerHistory,
)
from api.v1.v1_forms.constants import SubmissionTypes


def seed_approved_data(data):
    parent_data = FormData.objects.filter(
        form=data.form,
        uuid=data.uuid,
        parent=None,
    ).first()
    if data.data:
        form_data: FormData = data.data
        form_data.parent = parent_data
        form_data.name = data.name
        form_data.uuid = data.uuid
        form_data.form = data.form
        form_data.administration = data.administration
        form_data.geo = data.geo
        form_data.updated_by = data.created_by
        form_data.updated = timezone.now()
        form_data.submission_type = data.submission_type
        form_data.save()

        for answer in data.pending_data_answer.all():
            form_answer = Answers.objects.get(
                data=form_data, question=answer.question
            )

            AnswerHistory.objects.create(
                data=form_answer.data,
                question=form_answer.question,
                name=form_answer.name,
                value=form_answer.value,
                options=form_answer.options,
                created_by=form_answer.created_by,
            )
            form_answer.delete()
    else:
        form_data = FormData.objects.create(
            parent=parent_data,
            name=data.name,
            uuid=data.uuid,
            form=data.form,
            administration=data.administration,
            geo=data.geo,
            created_by=data.created_by,
            created=data.created,
            submission_type=data.submission_type,
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

    if form_data.submission_type in [
        SubmissionTypes.registration,
        SubmissionTypes.monitoring,
    ]:
        form_data.save_to_file
