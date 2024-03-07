import logging
from api.v1.v1_jobs.models import Jobs, JobStatus
from utils.administration_upload_template import (
    generate_administration_template
)
from django.utils import timezone

logger = logging.getLogger(__name__)


def download_administration_data(job_id: int):
    job = Jobs.objects.get(pk=job_id)
    try:
        job_info = job.info
        return generate_administration_template(
            job_result=job.result,
            attributes=job_info['attributes'],
            adm_id=job_info['adm_id'],
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
