import os

import pandas as pd
from django.utils import timezone
from django_q.tasks import async_task

from api.v1.v1_forms.models import Forms
from api.v1.v1_jobs.constants import JobStatus, JobTypes
from api.v1.v1_jobs.functions import HText
from api.v1.v1_jobs.models import Jobs
from api.v1.v1_jobs.seed_data import seed_excel_data
from api.v1.v1_jobs.validate_upload import validate
from api.v1.v1_profile.models import Administration
from utils import storage
from utils.functions import update_date_time_format
from utils.storage import upload


def download(form: Forms, administration_ids):
    filter_data = {}
    if administration_ids:
        filter_data['administration_id__in'] = administration_ids
    data = form.form_form_data.filter(**filter_data).order_by('-id')
    return [d.to_data_frame for d in data]


def rearrange_columns(col_names: list):
    col_question = list(filter(lambda x: HText(x).hasnum, col_names))
    col_names = [
                    "id", "created_at", "created_by", "updated_at",
                    "updated_by",
                    "datapoint_name", "administration", "geolocation"
                ] + col_question
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
    url = upload(file=file_path, folder='download', public=True)
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
    except Exception:
        return False
    return True


def seed_data_job_result(task):
    job = Jobs.objects.get(task_id=task.id)
    job.attempt = job.attempt + 1
    if task.result:
        job.status = JobStatus.done
        job.available = timezone.now()
    else:
        job.status = JobStatus.failed
    job.save()


def validate_excel(job_id):
    job = Jobs.objects.get(pk=job_id)
    storage.download(f"upload/{job.info.get('file')}")
    data = validate(job.info.get('form'), job.info.get('administration'),
                    f"./tmp/{job.info.get('file')}")

    if len(data):
        error_list = pd.DataFrame(data)
        error_list = error_list[list(
            filter(lambda x: x != "error", list(error_list)))]
        error_file = f"./tmp/error-{1}.csv"
        error_list.to_csv(error_file, index=False)
        # TODO: send email with error file
        return False
    return True


def validate_excel_result(task):
    job = Jobs.objects.get(task_id=task.id)
    job.attempt = job.attempt + 1
    if task.result:
        job.status = JobStatus.done
        job.available = timezone.now()
        job.save()
        new_job = Jobs.objects.create(
            type=JobTypes.seed_data,
            status=JobStatus.on_progress,
            user=job.user,
            info={
                'file': job.info.get('file'),
                'form': job.info.get('form'),
                'administration': job.info.get('administration'),
                'ref_job_id': job.id,
            }
        )
        task_id = async_task(
            'api.v1.v1_jobs.job.seed_data_job', new_job.id,
            hook='api.v1.v1_jobs.job.seed_data_job_result')
        new_job.task_id = task_id
        new_job.save()
    else:
        job.status = JobStatus.failed
        job.save()
