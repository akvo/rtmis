import uuid

from django.core.management import BaseCommand
from django.utils import timezone
from django_q.tasks import async_task

from api.v1.v1_forms.models import Forms
from api.v1.v1_jobs.constants import JobTypes, JobStatus
from api.v1.v1_jobs.models import Jobs


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("form", nargs="+", type=int)
        parser.add_argument("user", nargs="+", type=int)
        parser.add_argument(
            "-a", "--administration", nargs="?", default=0, type=int
        )
        parser.add_argument("-t", "--type", nargs="?", default="all", type=str)

    def handle(self, *args, **options):
        administration = options.get("administration")
        download_type = options.get("type")
        info = {
            "form_id": options.get("form")[0],
            "administration": administration if administration > 0 else None,
            "download_type": download_type if download_type else "all",
        }
        form = Forms.objects.get(pk=options.get("form")[0])
        form_name = form.name.replace(" ", "_").lower()
        today = timezone.datetime.today().strftime("%y%m%d")
        out_file = "download-{0}-{1}-{2}.xlsx".format(
            form_name, today, uuid.uuid4()
        )
        job = Jobs.objects.create(
            type=JobTypes.download,
            user_id=options.get("user")[0],
            status=JobStatus.on_progress,
            info=info,
            result=out_file,
        )
        task_id = async_task(
            "api.v1.v1_jobs.job.job_generate_download",
            job.id,
            **info,
            hook="api.v1.v1_jobs.job.job_generate_download_result"
        )
        job.task_id = task_id
        job.save()
        return str(job.id)
