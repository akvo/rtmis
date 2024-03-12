import logging
import uuid
from api.v1.v1_jobs.models import Jobs, JobStatus
from api.v1.v1_jobs.constants import JobTypes
from api.v1.v1_profile.models import Administration
from django_q.tasks import async_task

from utils.upload_administration import (
    generate_administration_template
)
from utils.upload_entities import (
    generate_list_of_entities
)
from django.utils import timezone

logger = logging.getLogger(__name__)


def create_download_job(
    user_id: int,
    job_type: JobTypes,
    job_info: dict,
    adm_id: int = None,
):
    file_name = JobTypes.FieldStr.get(job_type).replace("_", "-")
    if adm_id:
        find_adm = Administration.objects.get(pk=adm_id)
        file_name += "-" + find_adm.name.replace(" ", "_").lower()
    today = timezone.datetime.today().strftime("%y%m%d")
    out_file = "{0}-{1}-{2}.xlsx".format(
        file_name.replace("/", "_"),
        today,
        uuid.uuid4()
    )
    job = Jobs.objects.create(
        type=job_type,
        user_id=user_id,
        status=JobStatus.on_progress,
        info={
            "file": out_file,
            **job_info
        },
        result=out_file,
    )
    task_id = async_task(
        "api.v1.v1_profile.job.download_master_data",
        job.id, job.type,
        hook="api.v1.v1_profile.job.download_master_data_result",
    )
    job.task_id = task_id
    job.save()
    return job


def download_master_data(job_id: int, job_type: JobTypes):
    job = Jobs.objects.get(pk=job_id)
    job_info = job.info
    try:
        if job_type == JobTypes.download_administration:
            return generate_administration_template(
                job_result=job.result,
                attributes=job_info['attributes'],
                adm_id=job_info['administration'],
            )
        if job_type == JobTypes.download_entities:
            entity_ids = [e["id"] for e in job_info["entities"]]
            return generate_list_of_entities(
                file_path=job.result,
                adm_id=job_info['administration'],
                entity_ids=entity_ids,
            )
    except Exception as unknown_error:
        job.status = JobStatus.failed
        job.save()
        logger.error({
            'error': unknown_error
        })


def download_master_data_result(task):
    job = Jobs.objects.get(task_id=task.id)
    job.attempt = job.attempt + 1
    if task.success and job.status != JobStatus.failed:
        job.status = JobStatus.done
        job.available = timezone.now()
    else:
        job.status = JobStatus.failed
    job.save()
