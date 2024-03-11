import os
import pandas as pd
from django.test import TestCase
from django.test.utils import override_settings
from django.core.management import call_command
from api.v1.v1_profile.models import Entity
from utils.upload_entities import generate_list_of_entities


@override_settings(USE_TZ=False)
class DownloadAllEntitiesTestCase(TestCase):
    def setUp(self) -> None:
        super().setUp()
        call_command("administration_seeder", "--test")
        call_command("entities_seeder", "--test")

    def test_generate_excel_entities(self):
        file_path = "./entities.xlsx"
        generate_list_of_entities(file_path)
        self.assertTrue(os.path.exists(file_path))
        # read the file
        for entity in Entity.objects.all():
            df = pd.read_excel(file_path, sheet_name=entity.name)
            self.assertTrue(df.shape[0] > 0)
        # remove the file
        os.remove(file_path)
