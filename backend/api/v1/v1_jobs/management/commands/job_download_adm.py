import uuid

from django.core.management import BaseCommand
from django.utils import timezone
from django_q.tasks import async_task

from api.v1.v1_profile.models import Administration
from api.v1.v1_jobs.constants import JobTypes, JobStatus
from api.v1.v1_jobs.models import Jobs


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("administration", nargs="+", type=int)
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
        adm_id = options.get("administration")[0]\
            if options.get("administration") else None
        find_adm = Administration.objects.get(pk=adm_id)
        file_name = find_adm.name.replace(" ", "_").lower() \
            if find_adm else adm_id
        today = timezone.datetime.today().strftime("%y%m%d")
        out_file = "download-{0}-{1}-{2}.xlsx".format(
            file_name.replace("/", "_"),
            today,
            uuid.uuid4()
        )
        info = {
            "file": out_file,
            "adm_id": adm_id,
            "attributes": attributes
        }
        job = Jobs.objects.create(
            type=JobTypes.download_administration,
            user_id=options.get("user")[0],
            status=JobStatus.on_progress,
            info=info,
            result=out_file,
        )
        task_id = async_task(
            "api.v1.v1_profile.job.download_administration_data",
            job.id,
            hook="api.v1.v1_profile.job.download_master_data_result",
        )
        job.task_id = task_id
        job.save()
        return str(job.id)
