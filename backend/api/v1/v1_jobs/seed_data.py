import math
import os

import pandas as pd

from api.v1.v1_data.models import PendingAnswers, PendingDataBatch, \
    PendingFormData, PendingDataApproval
from api.v1.v1_forms.constants import QuestionTypes
from api.v1.v1_forms.models import Questions, FormApprovalAssignment
from api.v1.v1_jobs.functions import HText
from api.v1.v1_jobs.models import Jobs
from api.v1.v1_profile.models import Administration
from api.v1.v1_users.models import SystemUser


def save_data(user: SystemUser, batch: PendingDataBatch, dp: dict, qs: dict):
    administration = None
    geo = None
    answerlist = []
    names = []
    for a in dp:
        aw = dp[a]
        if isinstance(aw, str):
            aw = HText(aw).clean
        if isinstance(aw, float):
            aw = None if math.isnan(aw) else aw
        valid = True
        q = qs[a]
        answer = PendingAnswers(question_id=q.id, created_by=user)
        if q.type == QuestionTypes.administration:
            adms = aw.split("|")
            adm_list = []
            for ix, adm in enumerate(adms):
                if len(adm_list):
                    parent = adm_list[ix - 1]
                    adm_list.append(
                        Administration.objects.get(name=adm,
                                                   parent_id=parent.id)
                    )
                else:
                    adm_list.append(
                        Administration.objects.get(name=adm)
                    )

            administration = adm_list[-1].id
            answer.value = administration
            if q.meta:
                names.append(adm_list[-1].name)

        if q.type == QuestionTypes.geo:
            if aw:
                geo = [float(g.strip()) for g in aw.split(",")]
                answer.options = geo
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
            answer.options = aw
            if q.meta:
                names = names + aw
        if valid:
            answerlist.append(answer)
    name = " - ".join([str(n) for n in names])
    data = PendingFormData.objects.create(
        name=name,
        form_id=batch.form_id,
        administration_id=administration,
        geo=geo,
        batch=batch,
        created_by=batch.user
    )
    for val in answerlist:
        val.pending_data = data
    PendingAnswers.objects.bulk_create(answerlist)
    return data


def seed_excel_data(job: Jobs):
    file = f"./tmp/{job.info.get('file')}"
    df = pd.read_excel(file, sheet_name="data")
    questions = {}
    columns = {}
    for q in list(df):
        id = q.split("|")[0]
        columns.update({q: id})
        question = Questions.objects.get(pk=id)
        questions.update({id: question})
    df = df.rename(columns=columns)
    datapoints = df.to_dict("records")
    batch = PendingDataBatch.objects.create(
        form_id=job.info.get('form'),
        administration_id=job.info.get('administration'),
        user=job.user,
        name='Auto Generated'
    )
    records = []
    for datapoint in datapoints:
        data = save_data(user=job.user,
                         batch=batch,
                         dp=datapoint,
                         qs=questions)
        records.append(data)
    path = '{0}{1}'.format(batch.administration.path,
                           batch.administration_id)
    for administration in Administration.objects.filter(
            id__in=path.split('.')):
        assignment = FormApprovalAssignment.objects.filter(
            form_id=batch.form_id, administration=administration).first()
        if assignment:
            level = assignment.user.user_access.administration.level_id
            PendingDataApproval.objects.create(
                batch=batch,
                user=assignment.user,
                level_id=level
            )
    os.remove(file)
    return records
