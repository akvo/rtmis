import logging
from api.v1.v1_jobs.models import Jobs, JobStatus
from utils.email_helper import send_email, EmailTypes
from utils.administration_upload_template import generate_prefilled_template
from django.utils import timezone

logger = logging.getLogger(__name__)


def download_prefilled_administrations(job_id: int):
    try:
        job = Jobs.objects.get(pk=job_id)
        job_info = job.info
        excel_file = generate_prefilled_template(
            attributes=job_info['attributes'],
            level=job_info['level'],
        )
        data = {
            'send_to': [job.user.email],
            'listing': [{
                'name': "Download Date",
                'value': job.created.strftime("%m-%d-%Y, %H:%M:%S"),
            }],
        }
        filename = (
            f"{timezone.now().strftime('%Y%m%d%H%M%S')}-{job.user.pk}-"
            "administrations-template.xlsx"
        )
        excel = {
            'name': filename,
            'file': excel_file
        }
        send_email(
            context=data,
            excel=excel,
            type=EmailTypes.administration_prefilled,
            content_type='application/vnd.ms-excel'
        )
        return True
    except Exception as unknown_error:
        print("unknown_error", unknown_error)
        logger.error({
            'error': unknown_error
        })
        return False


def download_prefilled_result(task):
    print("task", task)
    job = Jobs.objects.get(task_id=task.id)
    job.attempt = job.attempt + 1
    if task.success:
        job.status = JobStatus.done
        job.available = timezone.now()
    else:
        job.status = JobStatus.failed
    job.save()
