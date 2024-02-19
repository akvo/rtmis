from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from api.v1.v1_forms.models import Questions
from api.v1.v1_data.models import FormData
from api.v1.v1_jobs.job import download


@override_settings(USE_TZ=False)
class BulkUnitTestCase(TestCase):
    def setUp(self):
        call_command("form_seeder", "--test")
        call_command("administration_seeder", "--test")
        user = {"email": "admin@rush.com", "password": "Test105*"}
        user = self.client.post('/api/v1/login',
                                user,
                                content_type='application/json')
        call_command("fake_data_seeder", "-r", 2, "--test", True)

    def test_data_download_list_of_columns(self):
        form_data = FormData.objects.count()
        self.assertTrue(form_data)
        form_data = FormData.objects.first()
        administration = form_data.administration
        download_response = download(form_data.form, [administration.id])
        self.assertTrue(download_response)
        download_columns = list(download_response[0].keys())
        questions = Questions.objects.filter(form=form_data.form).values_list(
            "variable", flat=True)
        meta_columns = ["id", "created_at", "created_by", "updated_at",
                        "updated_by", "datapoint_name", "administration",
                        "geolocation"]
        columns = list(
            filter(lambda x: x not in meta_columns, download_columns)
        )
        self.assertEqual(list(columns).sort(), list(questions).sort())
