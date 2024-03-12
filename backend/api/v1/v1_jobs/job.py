import logging
import os
from django_q.models import Task

import pandas as pd
from django.utils import timezone
from django_q.tasks import async_task
from api.v1.v1_jobs.administrations_bulk_upload import (
        seed_administration_data,
        validate_administrations_bulk_upload)

from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_forms.models import Forms
from api.v1.v1_jobs.constants import JobStatus, JobTypes
# from api.v1.v1_jobs.functions import HText
from api.v1.v1_jobs.models import Jobs
from api.v1.v1_jobs.seed_data import seed_excel_data
from api.v1.v1_jobs.validate_upload import validate
from api.v1.v1_profile.models import Administration
from api.v1.v1_users.models import SystemUser
from utils import storage
from utils.email_helper import send_email, EmailTypes
from utils.export_form import generate_definition_sheet
from utils.functions import update_date_time_format
from utils.storage import upload

logger = logging.getLogger(__name__)


def download(form: Forms, administration_ids):
    filter_data = {}
    if administration_ids:
        filter_data['administration_id__in'] = administration_ids
    data = form.form_form_data.filter(**filter_data).order_by('-id')
    return [d.to_data_frame for d in data]


def rearrange_columns(col_names: list):
    meta_columns = ["id", "created_at", "created_by", "updated_at",
                    "updated_by", "datapoint_name", "administration",
                    "geolocation"]
    col_question = list(filter(lambda x: x not in meta_columns, col_names))
    if len(col_question) == len(col_names):
        return col_question
    col_names = meta_columns + col_question
    return col_names


def job_generate_download(job_id, **kwargs):
    job = Jobs.objects.get(pk=job_id)
    file_path = './tmp/{0}'.format(job.result)
    if os.path.exists(file_path):
        os.remove(file_path)
    administration_ids = False
    administration_name = "All Administration Level"
    if kwargs.get('administration'):
        administration = Administration.objects.get(
            pk=kwargs.get('administration'))
        if administration.path:
            filter_path = '{0}{1}.'.format(administration.path,
                                           administration.id)
        else:
            filter_path = f"{administration.id}."
        administration_ids = list(
            Administration.objects.filter(
                path__startswith=filter_path).values_list('id',
                                                          flat=True))
        administration_ids.append(administration.id)

        administration_name = list(
            Administration.objects.filter(
                path__startswith=filter_path).values_list('name',
                                                          flat=True))
    form = Forms.objects.get(pk=job.info.get('form_id'))
    data = download(form=form, administration_ids=administration_ids)
    df = pd.DataFrame(data)
    col_names = rearrange_columns(list(df))
    df = df[col_names]
    writer = pd.ExcelWriter(file_path, engine='xlsxwriter')
    df.to_excel(writer, sheet_name='data', index=False)
    generate_definition_sheet(form=form, writer=writer)
    context = [{
        "context": "Form Name",
        "value": form.name
    }, {
        "context": "Download Date",
        "value": update_date_time_format(job.created)
    }, {
        "context": "Administration",
        "value": ','.join(administration_name) if isinstance(
            administration_name, list) else administration_name
    }]

    context = pd.DataFrame(context).groupby(["context", "value"],
                                            sort=False).first()
    context.to_excel(writer, sheet_name='context', startrow=0, header=False)
    workbook = writer.book
    worksheet = writer.sheets['context']
    f = workbook.add_format({
        'align': 'left',
        'bold': False,
        'border': 0,
    })
    worksheet.set_column('A:A', 20, f)
    worksheet.set_column('B:B', 30, f)
    merge_format = workbook.add_format({
        'bold': True,
        'border': 1,
        'align': 'center',
        'valign': 'vcenter',
        'fg_color': '#45add9',
        'color': '#ffffff',
    })
    worksheet.merge_range('A1:B1', 'Context', merge_format)
    writer.save()
    url = upload(file=file_path, folder='download')
    return url


def job_generate_download_result(task):
    job = Jobs.objects.get(task_id=task.id)
    job.attempt = job.attempt + 1
    if task.success:
        job.status = JobStatus.done
        job.available = timezone.now()
    else:
        job.status = JobStatus.failed
    job.save()


def seed_data_job(job_id):
    try:
        job = Jobs.objects.get(pk=job_id)
        seed_excel_data(job)
    except (ValueError, OSError, NameError, TypeError):
        print("Error seed data job")
        return False
    except Exception as unknown_error:
        print("Unknown error seed data job", unknown_error)
        return False
    return True


def seed_data_job_result(task):
    job = Jobs.objects.get(task_id=task.id)
    job.attempt = job.attempt + 1
    is_super_admin = job.user.user_access.role == UserRoleTypes.super_admin
    if task.result:
        job.status = JobStatus.done
        job.available = timezone.now()
        form_id = job.info.get("form")
        form = Forms.objects.filter(pk=int(form_id)).first()
        file = job.info.get("file")
        storage.download(f"upload/{file}")
        df = pd.read_excel(f"./tmp/{file}", sheet_name='data')
        subject = "New Data Uploaded" if is_super_admin \
            else 'New Request @{0}'.format(job.user.get_full_name())
        data = {
            'subject': subject,
            'title': "New Data Submission",
            'send_to': [job.user.email],
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
            'is_super_admin': is_super_admin
        }
        send_email(context=data, type=EmailTypes.new_request)
    else:
        job.status = JobStatus.failed
    job.save()


def validate_excel(job_id):
    job = Jobs.objects.get(pk=job_id)
    storage.download(f"upload/{job.info.get('file')}")
    data = validate(job.info.get('form'), job.info.get('administration'),
                    f"./tmp/{job.info.get('file')}")

    if len(data):
        form_id = job.info.get("form")
        form = Forms.objects.filter(pk=int(form_id)).first()
        file = job.info.get("file")
        df = pd.read_excel(f"./tmp/{file}", sheet_name='data')
        error_list = pd.DataFrame(data)
        error_list = error_list[list(
            filter(lambda x: x != "error", list(error_list)))]
        error_file = f"./tmp/error-{job_id}.csv"
        error_list.to_csv(error_file, index=False)
        data = {
            'send_to': [job.user.email],
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
        send_email(context=data,
                   type=EmailTypes.upload_error,
                   path=error_file,
                   content_type='text/csv')
        return False
    return True


def validate_excel_result(task):
    job = Jobs.objects.get(task_id=task.id)
    job.attempt = job.attempt + 1
    job_info = job.info
    if task.result:
        job.status = JobStatus.done
        job.available = timezone.now()
        job.save()
        job_info.update({'ref_job_id': job.id})
        new_job = Jobs.objects.create(
            result=job.info.get('file'),
            type=JobTypes.seed_data,
            status=JobStatus.on_progress,
            user=job.user,
            info=job_info
        )
        task_id = async_task(
            'api.v1.v1_jobs.job.seed_data_job', new_job.id,
            hook='api.v1.v1_jobs.job.seed_data_job_result')
        new_job.task_id = task_id
        new_job.save()
    else:
        job.status = JobStatus.failed
        job.save()


def handle_administrations_bulk_upload(filename, user_id, upload_time):
    user = SystemUser.objects.get(id=user_id)
    storage.download(f"upload/{filename}")
    file_path = f"./tmp/{filename}"
    errors = validate_administrations_bulk_upload(file_path)
    df = pd.read_excel(file_path, sheet_name='data')
    email_context = {
        'send_to': [user.email],
        'listing': [
            {
                'name': 'Upload Date',
                'value': upload_time.strftime('%m-%d-%Y, %H:%M:%S'),
            },
            {
                'name': 'Questionnaire',
                'value': 'Administrative List',
            },
            {
                'name': "Number of Records",
                'value': df.shape[0]
            },
        ]
    }
    if len(errors):
        logger.error(errors)
        error_file = (
            "./tmp/administration-error-"
            f"{upload_time.strftime('%Y%m%d%H%M%S')}-{user.id}.csv"
        )
        error_list = pd.DataFrame(errors)
        error_list.to_csv(error_file, index=False)
        send_email(context=email_context,
                   type=EmailTypes.upload_error,
                   path=error_file,
                   content_type='text/csv')
        return
    seed_administration_data(file_path)
    send_email(context=email_context, type=EmailTypes.administration_upload)


def handle_administrations_bulk_upload_failure(task: Task):
    if task.success:
        return
    logger.error({
        'error': 'Failed running background job',
        'id': task.id,
        'name': task.name,
        'started': task.started,
        'stopped': task.stopped,
        'args': task.args,
        'kwargs': task.kwargs,
        'body': task.result,
    })
