from django.test import TestCase
from django.test.utils import override_settings

from django.core.management import call_command
from django.utils import timezone
from api.v1.v1_profile.tests.mixins import ProfileTestHelperMixin
from api.v1.v1_profile.models import EntityData
from utils.upload_entities import (
    validate_entity_file,
    validate_entity_data
)
from api.v1.v1_jobs.job import handle_entities_bulk_upload


@override_settings(USE_TZ=False)
class EntityTestBulkUploadCase(TestCase, ProfileTestHelperMixin):
    def setUp(self):
        super().setUp()
        call_command("administration_seeder", "--test")
        self.user = self.create_user("test@akvo.org", self.ROLE_ADMIN)
        call_command("entities_seeder", "--test")
        self.token = self.get_auth_token(self.user.email)
        test_folder = "api/v1/v1_profile/tests/fixtures"
        self.test_file = f"{test_folder}/entities-test.xlsx"
        self.test_file_2 = f"{test_folder}/entities-test-2.xlsx"

    def test_bulk_upload_entities_core(self):
        # validate the entity file
        error_list = validate_entity_file(self.test_file)
        self.assertEqual(
            error_list, [{
                "sheet": "Train Station",
                "row": 1,
                "message": "Entity of Train Station not found",
            }],
        )
        # validate the entity data
        total_entities_before = EntityData.objects.count()
        error_list = validate_entity_data(self.test_file)
        e_1 = "Indonesia - Yogyakarta - Sleman - Depok - Catur Tunggal"
        e_2 = "Indonesia - Yogyakarta - East Jakarta - Kramat Jati - Cawang"
        error_prediction = [
            {
                "sheet": "School",
                "row": 5,
                "message": f"Invalid Administration for {e_1}",
            },
            {
                "sheet": "School",
                "row": 6,
                "message": f"Invalid Administration for {e_2}",
            },
        ]
        self.assertEqual(error_list, error_prediction)
        successful_upload = EntityData.objects.count() - total_entities_before
        self.assertEqual(successful_upload, 5)

        # second file
        error_list = validate_entity_file(self.test_file_2)
        self.assertEqual(error_list, [])

        # validate the entity data
        EntityData.objects.all().delete()
        total_entities_before = EntityData.objects.count()
        error_list = validate_entity_data(self.test_file_2)
        successful_upload = EntityData.objects.count() - total_entities_before
        self.assertEqual(successful_upload, 2)
        all_entities = EntityData.objects.all()
        successful_predictions = [{
            "name": "Cepit Basic School",
            "administration": "Cepit Baru"
        }, {
            "name": "Seturan Basic School",
            "administration": "Seturan"
        }]
        self.assertEqual([
            {
                "name": entity.name,
                "administration": entity.administration.name
            }
            for entity in all_entities
        ], successful_predictions)

    def test_bulk_upload_url(self):
        response = self.client.post(
            "/api/v1/upload/bulk-entities/",
            {
                "file": open(self.test_file, "rb"),
            },
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(list(response.data), ["task_id", "filename"])
        filename = response.data["filename"]

        errors = handle_entities_bulk_upload(
            filename,
            self.user.id,
            timezone.now()
        )
        self.assertEqual(errors, None)
