import uuid

from django.core.management import BaseCommand
from django.utils import timezone
from django_q.tasks import async_task

from api.v1.v1_profile.models import Levels
from api.v1.v1_jobs.constants import JobTypes, JobStatus
from api.v1.v1_jobs.models import Jobs


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("level", nargs="+", type=int)
        parser.add_argument("user", nargs="+", type=int)
        parser.add_argument(
            "-a",
            "--attributes",
            action="append",
            default=[],
            dest="attributes",
            help="attributes list [,]",
        )

    def handle(self, *args, **options):
        attributes = options.get("attributes")
        level_id = options.get("level")[0] if options.get("level") else None
        last_level = Levels.objects.order_by("-id")[0]
        level = (
            Levels.objects.get(pk=options.get("level")[0])
            if level_id else last_level
        )
        level_name = level.name.replace(" ", "_").lower()
        today = timezone.datetime.today().strftime("%y%m%d")
        out_file = "download-{0}-{1}-{2}.xlsx".format(
            level_name,
            today,
            uuid.uuid4()
        )
        info = {"file": out_file, "level": level_id, "attributes": attributes}
        job = Jobs.objects.create(
            type=JobTypes.download_administration,
            user_id=options.get("user")[0],
            status=JobStatus.on_progress,
            info=info,
            result=out_file,
        )
        task_id = async_task(
            "api.v1.v1_profile.job.download_prefilled_administrations",
            job.id,
            hook="api.v1.v1_profile.job.download_prefilled_result",
        )
        job.task_id = task_id
        job.save()
        return str(job.id)
