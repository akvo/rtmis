import math
import os

import pandas as pd
import numpy as np

from api.v1.v1_data.models import PendingAnswers, PendingDataBatch, \
    PendingFormData, PendingDataApproval, Answers
from api.v1.v1_forms.models import Forms
from api.v1.v1_forms.constants import QuestionTypes
from api.v1.v1_forms.models import Questions, FormApprovalAssignment
from api.v1.v1_jobs.functions import HText
from api.v1.v1_jobs.models import Jobs
from api.v1.v1_profile.models import Administration
from api.v1.v1_users.models import SystemUser
from utils.email_helper import send_email, EmailTypes


def save_data(user: SystemUser, batch: PendingDataBatch, dp: dict, qs: dict):
    administration = None
    geo = None
    answerlist = []
    names = []
    data_id = None if math.isnan(dp['data_id']) else dp['data_id']

    for a in dp:
        if a == 'data_id':
            continue
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
                                                   parent_id=parent.id))
                else:
                    adm_list.append(Administration.objects.get(name=adm))

            administration = adm_list[-1].id
            answer.value = administration
            if q.meta:
                names.append(adm_list[-1].name)

        if q.type == QuestionTypes.geo:
            if aw:
                aw = aw.strip().replace('|', ',')
                geo = [float(g) for g in aw.split(",")]
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
            answer.options = aw.split('|')
            if q.meta:
                names = names + aw.replace('|', '-')
        if valid:
            if data_id:
                try:
                    form_answer = Answers.objects.get(
                        data_id=data_id, question_id=answer.question_id)
                    if not (form_answer.name == answer.name
                            and form_answer.options == answer.options
                            and form_answer.value == answer.value):
                        answerlist.append(answer)
                except Answers.DoesNotExist:
                    answerlist.append(answer)
            else:
                answerlist.append(answer)
    name = " - ".join([str(n) for n in names])
    data = PendingFormData.objects.create(name=name,
                                          form_id=batch.form_id,
                                          administration_id=administration,
                                          geo=geo,
                                          data_id=data_id,
                                          batch=batch,
                                          created_by=batch.user)
    for val in answerlist:
        val.pending_data = data
    PendingAnswers.objects.bulk_create(answerlist)
    return data


def seed_excel_data(job: Jobs):
    file = f"./tmp/{job.info.get('file')}"
    df = pd.read_excel(file, sheet_name="data")
    if "id" in list(df):
        df = df.rename(columns={'id': 'data_id'})
    if "data_id" not in list(df):
        df["data_id"] = np.nan
    df = df[list(filter(lambda x: "|" in x, list(df))) + ['data_id']]
    questions = {}
    columns = {}
    for q in list(df):
        if q != 'data_id':
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
        name=job.info.get('file'))
    records = []
    for datapoint in datapoints:
        data: PendingFormData = save_data(user=job.user,
                                          batch=batch,
                                          dp=datapoint,
                                          qs=questions)
        if data.pending_data_answer.count():
            records.append(data)
        else:
            data.delete()
    if len(records) == 0:
        form_id = job.info.get("form")
        form = Forms.objects.filter(pk=int(form_id)).first()
        context = {
            'send_to': [batch.user.email],
            'form': batch.form,
            'user': job.user,
            'listing': [{
                'name': "Upload Date",
                'value': job.created.strftime("%m-%d-%Y, %H:%M:%S"),
            }, {
                'name': "Questionnaire",
                'value': form.name
            }, {
                'name': "Number of Records",
                'value': df.shape[0]
            }],
        }
        send_email(context=context, type=EmailTypes.unchanged_data)
        batch.delete()
        os.remove(file)
        return None
    path = '{0}{1}'.format(batch.administration.path, batch.administration_id)
    for administration in Administration.objects.filter(
            id__in=path.split('.')):
        assignment = FormApprovalAssignment.objects.filter(
            form_id=batch.form_id, administration=administration).first()
        if assignment:
            level = assignment.user.user_access.administration.level_id
            PendingDataApproval.objects.create(batch=batch,
                                               user=assignment.user,
                                               level_id=level)
            context = {
                'send_to': [assignment.user.email],
                'listing': [{
                    'name': "Batch Name",
                    'value': batch.name
                }, {
                    'name': "Questionnaire",
                    'value': batch.form.name
                }, {
                    'name': "Number of Records",
                    'value': df.shape[0]
                }, {
                    'name': "Submitter",
                    'value': f"{job.user.name}, {job.user.designation_name}"
                }]
            }
            send_email(context=context, type=EmailTypes.pending_approval)

    os.remove(file)
    return records
