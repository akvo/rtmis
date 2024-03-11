import os
import pandas as pd
from django.test import TestCase
from django.test.utils import override_settings
from django.core.management import call_command
from api.v1.v1_profile.models import Administration, Entity, EntityData
from utils.upload_entities import generate_list_of_entities


@override_settings(USE_TZ=False)
class DownloadEntitiesTestCase(TestCase):
    def setUp(self) -> None:
        super().setUp()
        call_command("administration_seeder", "--test")
        call_command("entities_seeder", "--test")

    def test_generate_excel_for_all_entities(self):
        file_path = "./entities.xlsx"
        generate_list_of_entities(file_path)
        self.assertTrue(os.path.exists(file_path))
        # read the file
        for entity in Entity.objects.all():
            df = pd.read_excel(file_path, sheet_name=entity.name)
            self.assertTrue(df.shape[0] > 0)
        # remove the file
        os.remove(file_path)

    def test_generate_excel_for_selected_entities(self):
        file_path = "./entities.xlsx"
        entities = Entity.objects.first()
        generate_list_of_entities(
            file_path=file_path,
            entity_id=[entities.id]
        )
        self.assertTrue(os.path.exists(file_path))
        # read the file
        df = pd.read_excel(file_path, sheet_name=entities.name)
        self.assertTrue(df.shape[0] > 0)
        # make sure that the file does not contain other entities
        for entity in Entity.objects.exclude(id=entities.id):
            with self.assertRaises(ValueError):
                pd.read_excel(file_path, sheet_name=entity.name)
        # remove the file
        os.remove(file_path)

    def test_generate_excel_for_selected_entities_and_administration(self):
        file_path = "./entities.xlsx"
        entity_example = EntityData(
            name="Example",
            code="EX",
            administration=Administration.objects.filter(level=4).last(),
            entity=Entity.objects.first()
        )
        entity_example.save()
        generate_list_of_entities(
            file_path=file_path,
            administration_id=entity_example.administration.id
        )
        self.assertTrue(os.path.exists(file_path))
        # read the file
        df = pd.read_excel(file_path, sheet_name=entity_example.entity.name)
        # make sure that the row contains the first_entity_data
        self.assertTrue(
            df[df["Name"] == entity_example.name].shape[0] > 0
        )
        # remove the file
        os.remove(file_path)
