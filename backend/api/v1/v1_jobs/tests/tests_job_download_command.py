from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from api.v1.v1_forms.models import Forms
from api.v1.v1_jobs.models import Jobs
from api.v1.v1_jobs.job import (
    job_generate_data_download,
)
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.constants import UserRoleTypes


@override_settings(USE_TZ=False)
class JobDownloadUnitTestCase(TestCase):
    def setUp(self):
        call_command("form_seeder", "--test")
        call_command("administration_seeder", "--test")
        call_command("demo_approval_flow", "--test", True)
        user = {"email": "admin@rush.com", "password": "Test105*"}
        user = self.client.post('/api/v1/login',
                                user,
                                content_type='application/json')
        call_command("fake_data_seeder", "-r", 2, "--test", True)
        call_command("fake_data_claim_seeder", "-r", 2, "-t", True)

    def test_download_all_data(self):
        form = Forms.objects.get(pk=1)
        admin = SystemUser.objects.filter(
            user_access__role=UserRoleTypes.admin
        ).first()
        result = call_command(
            "job_download",
            form.id,
            admin.id,
            "-a",
            0,
            "-t",
            "all",
        )
        self.assertTrue(result)

        job = Jobs.objects.get(pk=result)
        self.assertEqual(job.info.get("download_type"), "all")

        url = job_generate_data_download(job_id=job.id, **job.info)
        self.assertTrue("download-test_form" in url)
