from django.core.management import BaseCommand
from django_q.tasks import async_task

from api.v1.v1_jobs.constants import JobTypes, JobStatus
from api.v1.v1_jobs.models import Jobs
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.constants import UserRoleTypes


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "-t",
            "--test",
            nargs="?",
            const=1,
            default=False,
            type=int
        )

    def handle(self, *args, **options):
        # test = options.get("test")
        result = "kenya-administration.csv"

        admin = SystemUser.objects.filter(
            user_access__role=UserRoleTypes.admin
        ).first()
        job = Jobs.objects.create(
            type=JobTypes.download_all_administrations,
            user_id=admin.id,
            status=JobStatus.on_progress,
            result=result,
        )
        task_id = async_task(
            "api.v1.v1_profile.job.download_all_administrations",
            job.id,
            hook="api.v1.v1_profile.job.download_result",
        )
        job.task_id = task_id
        job.save()
        return str(job.id)
