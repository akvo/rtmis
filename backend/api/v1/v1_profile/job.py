import logging
from api.v1.v1_jobs.models import Jobs, JobStatus
from utils.administration_upload_template import generate_administration_template
from django.utils import timezone

logger = logging.getLogger(__name__)


def download_administration_data(job_id: int):
    try:
        job = Jobs.objects.get(pk=job_id)
        job_info = job.info
        return generate_administration_template(
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


def download_administration_data_result(task):
    print("task", task)
    job = Jobs.objects.get(task_id=task.id)
    job.attempt = job.attempt + 1
    if task.success:
        job.status = JobStatus.done
        job.available = timezone.now()
    else:
        job.status = JobStatus.failed
    job.save()
