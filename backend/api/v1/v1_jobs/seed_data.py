import math
import os

import pandas as pd
import numpy as np

from django.utils import timezone
from api.v1.v1_data.models import (
    PendingAnswers,
    PendingDataBatch,
    PendingFormData,
    PendingDataApproval,
    Answers,
    FormData,
    AnswerHistory,
    SubmissionTypes,
)
from api.v1.v1_forms.models import Forms
from api.v1.v1_forms.constants import QuestionTypes
from api.v1.v1_forms.models import Questions, FormApprovalAssignment
from api.v1.v1_jobs.functions import HText
from api.v1.v1_jobs.models import Jobs
from api.v1.v1_profile.models import Administration, Entity, EntityData
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.constants import UserRoleTypes
from utils.email_helper import send_email, EmailTypes
from uuid import uuid4


def get_geo_value(aw):
    geo = aw
    if isinstance(aw, str):
        aw = aw.strip().replace("|", ",")
        geo = [float(g) for g in aw.split(",")]
    return geo


def get_administration(aw: str) -> Administration:
    adms = aw.split("|")
    adm_list = []
    adm = None
    for ix, adm in enumerate(adms):
        find_adm = Administration.objects.filter(name=adm).first()
        if len(adm_list):
            parent = adm_list[ix - 1]
            find_adm = Administration.objects.filter(
                name=adm, parent_id=parent.id
            ).first()
        if find_adm:
            adm_list.append(find_adm)
    if len(adm_list):
        adm = adm_list[-1]
    return adm


def collect_answers(user: SystemUser, dp: dict, qs: dict, data_id):
    # check if prev submission exist
    prev_form_data = None
    if data_id:
        prev_form_data = FormData.objects.filter(pk=data_id).first()

    is_super_admin = user.user_access.role == UserRoleTypes.super_admin
    names = []
    administration = dp["administration"]
    if isinstance(administration, str):
        adm = get_administration(aw=administration)
        if adm:
            administration = adm.id
    geo = get_geo_value(aw=dp["geolocation"])
    answerlist = []
    answer_history_list = []

    # set submisstion type
    submission_type = SubmissionTypes.registration
    if dp["submission_type"] == dp["submission_type"]:
        st = getattr(SubmissionTypes, dp["submission_type"])
        if st:
            submission_type = st

    # set uuid based on submission type
    data_uuid = prev_form_data.uuid if prev_form_data else uuid4()

    for a in dp:
        if a in ["data_id", "submission_type"]:
            continue
        if a not in qs:
            continue
        aw = dp[a]
        q = qs[a]
        if aw != aw and not q.meta_uuid and not q.default_value:
            continue
        if isinstance(aw, str):
            aw = HText(aw).clean
        if isinstance(aw, float):
            aw = None if math.isnan(aw) else aw
        valid = True
        if (
            q.hidden
            and q.hidden.get("submission_type")
            and dp["submission_type"] in q.hidden["submission_type"]
            and aw
        ):
            aw = None
        if (
            q.disabled
            and q.disabled.get("submission_type")
            and dp["submission_type"] in q.disabled["submission_type"]
        ):
            # get/replace by answer from prev datapoint
            aw = None
            prev_answer = Answers.objects.get(
                data_id=prev_form_data.id, question_id=q.id
            )
            if prev_answer:
                aw = (
                    prev_answer.name
                    or prev_answer.value
                    or prev_answer.options
                )
        if (
            q.default_value
            and q.default_value.get("submission_type")
            and dp["submission_type"] in q.default_value["submission_type"]
        ):
            dv = dp["submission_type"].lower()
            aw = q.default_value["submission_type"][dv]

        answer = PendingAnswers(question_id=q.id, created_by=user)
        if q.type == QuestionTypes.administration:
            if isinstance(aw, str):
                adm = get_administration(aw=aw)
                if adm:
                    administration = adm.id
                    answer.value = administration
                    if q.meta:
                        names.append(adm.name)
            else:
                adm = Administration.objects.get(pk=aw)
                administration = aw
                answer.value = administration
                if adm and q.meta:
                    names.append(adm.name)

        if q.type == QuestionTypes.geo:
            if aw:
                answer.options = get_geo_value(aw=aw)
            else:
                valid = False
        if q.type == QuestionTypes.text:
            answer.name = aw
            if q.meta:
                names.append(aw)
        if q.type == QuestionTypes.date:
            if aw:
                answer.name = aw
            else:
                valid = False
        if q.type == QuestionTypes.number:
            try:
                float(aw)
                valid = True
            except ValueError:
                valid = False
            if valid:
                answer.value = aw
                if q.meta:
                    names.append(str(aw))
        if q.type == QuestionTypes.option:
            answer.options = [aw] if aw else None
            if q.meta and aw:
                names.append(aw)
        if q.type == QuestionTypes.multiple_option:
            if isinstance(aw, str):
                answer.options = aw.split("|")
                if q.meta:
                    names.append(aw.replace("|", "-"))
            else:
                answer.options = aw
                if q.meta and aw:
                    names.append("-".join(aw))
        if q.type == QuestionTypes.cascade and aw:
            answer.name = aw
            if q.extra and q.extra.get("type") == "entity" and administration:
                entity_adm = Administration.objects.get(pk=administration)
                entity = Entity.objects.filter(
                    name=q.extra.get("name")
                ).first()
                if not entity:
                    entity = Entity.objects.create(name=q.extra.get("name"))
                entity_data = EntityData.objects.filter(
                    entity=entity, name=aw
                ).first()
                if not entity_data and adm:
                    EntityData.objects.create(
                        name=aw, entity=entity, administration=entity_adm
                    )
        if q.type == QuestionTypes.autofield and aw:
            answer.name = aw
        if q.meta_uuid:
            if aw:
                answer.name = aw
                data_uuid = aw
            else:
                answer.name = data_uuid
        if q.type == QuestionTypes.photo and aw:
            answer.name = aw
        if valid:
            if data_id and submission_type != SubmissionTypes.monitoring:
                try:
                    form_answer = Answers.objects.get(
                        data_id=data_id, question_id=answer.question_id
                    )
                    if not (
                        form_answer.name == answer.name
                        and form_answer.options == answer.options
                        and form_answer.value == answer.value
                    ):
                        if is_super_admin:
                            # prev answer to answer history
                            answer_history_list.append(
                                AnswerHistory(
                                    data=form_answer.data,
                                    question=form_answer.question,
                                    name=form_answer.name,
                                    value=form_answer.value,
                                    options=form_answer.options,
                                    created_by=user,
                                )
                            )
                            answer.updated = timezone.now()
                            # delete prev answer
                            form_answer.delete()
                        answerlist.append(answer)
                except Answers.DoesNotExist:
                    answerlist.append(answer)
            else:
                answerlist.append(answer)
    name = " - ".join([str(n) for n in names])
    res = {
        "administration": administration,
        "geo": geo,
        "answerlist": answerlist,
        "name": name,
        "answer_history_list": answer_history_list,
        "uuid": data_uuid,
        "submission_type": submission_type,
    }
    return res


def get_decendants(administration: Administration):
    path = f"{administration.id}."
    if administration.path:
        path = "{0}{1}.".format(administration.path, administration.id)
    descendants = list(
        Administration.objects.filter(path__startswith=path).values_list(
            "id", flat=True
        )
    )
    descendants.append(administration.id)
    return descendants


def save_data(user: SystemUser, dp: dict, qs: dict, form_id: int, batch_id):
    is_super_admin = user.user_access.role == UserRoleTypes.super_admin
    data_id = None if math.isnan(dp["data_id"]) else dp["data_id"]
    temp = collect_answers(user=user, dp=dp, qs=qs, data_id=data_id)
    administration = temp.get("administration")
    geo = temp.get("geo")
    answerlist = temp.get("answerlist")
    name = temp.get("name")
    answer_history_list = temp.get("answer_history_list")
    submission_type = temp.get("submission_type")
    parent = FormData.objects.filter(uuid=temp.get("uuid")).first()

    # make data_id None if monitoring
    data_id = (
        data_id if submission_type != SubmissionTypes.monitoring else None
    )

    user_administration = user.user_access.administration
    user_decendants = get_decendants(administration=user_administration)
    if administration not in user_decendants:
        return None
    if is_super_admin:
        try:
            if submission_type != SubmissionTypes.monitoring:
                FormData.objects.filter(pk=data_id).update(
                    name=name,
                    form_id=form_id,
                    administration_id=administration,
                    geo=geo,
                    updated_by=user,
                    updated=timezone.now(),
                    uuid=temp.get("uuid"),
                    submission_type=submission_type,
                )
                data = FormData.objects.get(pk=data_id)
            else:
                data = FormData.objects.create(
                    name=name,
                    form_id=form_id,
                    administration_id=administration,
                    geo=geo,
                    created_by=user,
                    uuid=temp.get("uuid"),
                    submission_type=submission_type,
                )
        except FormData.DoesNotExist:
            data = FormData.objects.create(
                name=name,
                form_id=form_id,
                administration_id=administration,
                geo=geo,
                created_by=user,
                uuid=temp.get("uuid"),
                submission_type=submission_type,
                parent=parent,
            )
    else:
        # same logic as backend/api/v1/v1_data/views.py line 258
        data = PendingFormData.objects.create(
            name=name,
            form_id=form_id,
            administration_id=administration,
            geo=geo,
            data_id=data_id,
            batch_id=batch_id,
            created_by=user,
            uuid=temp.get("uuid"),
            submission_type=submission_type,
        )

    if is_super_admin:
        answer_to_create = []
        for val in answerlist:
            answer_to_create.append(
                Answers(
                    data=data,
                    question_id=val.question_id,
                    name=val.name,
                    value=val.value,
                    options=val.options,
                    created_by=val.created_by,
                )
            )
        Answers.objects.bulk_create(answer_to_create)
        if answer_history_list:
            AnswerHistory.objects.bulk_create(answer_history_list)
    else:
        for val in answerlist:
            val.pending_data = data
        PendingAnswers.objects.bulk_create(answerlist)
    return data


def seed_excel_data(job: Jobs, test: bool = False):
    is_super_admin = job.user.user_access.role == UserRoleTypes.super_admin
    file = f"./tmp/{job.info.get('file')}"
    if test:
        file = job.info.get('file')
    df = pd.read_excel(file, sheet_name="data")
    if "id" in list(df):
        df = df.rename(columns={"id": "data_id"})
    if "data_id" not in list(df):
        df["data_id"] = np.nan
    non_questions = [
        "created_at",
        "created_by",
        "updated_at",
        "updated_by",
        "datapoint_name",
    ]
    df = df[list(filter(lambda x: x not in non_questions, list(df)))]
    questions = {}
    columns = {}
    form_id = job.info.get("form")
    for q in list(df):
        question = Questions.objects.filter(name=q, form_id=form_id).first()
        if question:
            columns.update({q: question.id})
            id = question.id
            questions.update({id: question})
    df = df.rename(columns=columns)
    # lower submission type
    df["submission_type"] = df["submission_type"].str.lower()
    datapoints = df.to_dict("records")
    if not is_super_admin:
        batch = PendingDataBatch.objects.create(
            form_id=form_id,
            administration_id=job.info.get("administration"),
            user=job.user,
            name=job.info.get("file"),
        )
    records = []
    for datapoint in datapoints:
        if is_super_admin:
            data: FormData = save_data(
                user=job.user,
                dp=datapoint,
                qs=questions,
                form_id=form_id,
                batch_id=None,
            )
            answer_count = data.data_answer.count() if data else 0
        else:
            data: PendingFormData = save_data(
                user=job.user,
                dp=datapoint,
                qs=questions,
                form_id=form_id,
                batch_id=batch.id,
            )
            answer_count = data.pending_data_answer.count() if data else 0
        if answer_count:
            records.append(data)
        if answer_count == 0 and data:
            data.delete()
    if len(records) == 0:
        form = Forms.objects.filter(pk=int(form_id)).first()
        if not test:
            context = {
                "send_to": [job.user.email],
                "form": form.name,
                "user": job.user,
                "listing": [
                    {
                        "name": "Upload Date",
                        "value": job.created.strftime("%m-%d-%Y, %H:%M:%S"),
                    },
                    {"name": "Questionnaire", "value": form.name},
                    {"name": "Number of Records", "value": df.shape[0]},
                ],
            }
            send_email(context=context, type=EmailTypes.unchanged_data)
        if not is_super_admin:
            batch.delete()
        if not test:
            os.remove(file)
        return None
    if not is_super_admin:
        path = "{0}{1}".format(
            batch.administration.path, batch.administration_id
        )
        for administration in Administration.objects.filter(
            id__in=path.split(".")
        ):
            assignment = FormApprovalAssignment.objects.filter(
                form_id=batch.form_id, administration=administration
            ).first()
            if assignment:
                level = assignment.user.user_access.administration.level_id
                PendingDataApproval.objects.create(
                    batch=batch, user=assignment.user, level_id=level
                )
                if not test:
                    submitter = f"{job.user.name}, {job.user.designation_name}"
                    context = {
                        "send_to": [assignment.user.email],
                        "listing": [
                            {
                                "name": "Batch Name", "value": batch.name},
                            {
                                "name": "Questionnaire",
                                "value": batch.form.name
                            },
                            {
                                "name": "Number of Records",
                                "value": df.shape[0]
                            },
                            {
                                "name": "Submitter",
                                "value": submitter,
                            },
                        ],
                    }
                    send_email(
                        context=context,
                        type=EmailTypes.pending_approval
                    )
    if not test:
        os.remove(file)
    return records
