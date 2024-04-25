from io import StringIO

from django.test import TestCase
from django.test.utils import override_settings
from django.core.management import call_command
from api.v1.v1_profile.models import Administration
from api.v1.v1_jobs.models import Jobs
from api.v1.v1_jobs.constants import JobTypes, JobStatus
from api.v1.v1_profile.job import download_master_data
from api.v1.v1_profile.tests.mixins import ProfileTestHelperMixin


@override_settings(USE_TZ=False)
class DownloadAllAdmTestCase(TestCase, ProfileTestHelperMixin):
    def setUp(self) -> None:
        super().setUp()
        call_command("administration_seeder", "--test")
        self.user = self.create_user('test@akvo.org', self.ROLE_ADMIN)

    def call_command(self, *args, **kwargs):
        out = StringIO()
        call_command(
            "download_all_administrations",
            "--test",
            *args,
            stdout=out,
            stderr=StringIO(),
            **kwargs,
        )
        return out.getvalue()

    def test_csv_generated(self):
        output = self.call_command()
        location = "./storage/master_data/kenya-administration_test.csv"
        text = f"File Created: {location}"
        self.assertTrue(output, text)

    def test_generate_with_job(self):
        administration = Administration.objects.first()
        file_name = administration.name.replace(" ", "_").lower()
        out_file = "download-administration-{0}.xlsx".format(
            file_name.replace("/", "_"),
        )
        job = Jobs.objects.create(
            type=JobTypes.download_administration,
            user_id=self.user.id,
            status=JobStatus.on_progress,
            info={
                "administration": administration.id,
                "attributes": [],
            },
            result=out_file,
        )
        file_output = download_master_data(job_id=job.id, job_type=job.type)
        self.assertTrue(file_output)
