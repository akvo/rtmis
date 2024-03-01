import logging
from api.v1.v1_jobs.models import Jobs, JobStatus
from utils.administration_upload_template import (
    generate_prefilled_template,
    generate_administrations_template
)
from django.utils import timezone

logger = logging.getLogger(__name__)


def download_prefilled_administrations(job_id: int):
    try:
        job = Jobs.objects.get(pk=job_id)
        job_info = job.info
        return generate_prefilled_template(
            job_result=job.result,
            attributes=job_info['attributes'],
            adm_id=job_info['adm_id'],
        )
    except Exception as unknown_error:
        print("unknown_error", unknown_error)
        logger.error({
            'error': unknown_error
        })
        return False


def download_all_administrations(job_id: int):
    try:
        job = Jobs.objects.get(pk=job_id)
        return generate_administrations_template(
            job_result=job.result,
        )
    except Exception as unknown_error:
        print("unknown_error", unknown_error)
        logger.error({
            'error': unknown_error
        })
        return False


def download_result(task):
    print("task", task)
    job = Jobs.objects.get(task_id=task.id)
    job.attempt = job.attempt + 1
    if task.success:
        job.status = JobStatus.done
        job.available = timezone.now()
    else:
        job.status = JobStatus.failed
    job.save()
