import os
import pandas as pd
from typing import cast
from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from rest_framework.response import Response
from api.v1.v1_profile.models import (
    Levels,
    Administration,
    Entity,
)

from api.v1.v1_profile.tests.mixins import ProfileTestHelperMixin

os.environ['TESTING'] = 'True'


@override_settings(USE_TZ=False)
class EntitiesDataBulkUploadTemplateExportTestCase(
    TestCase, ProfileTestHelperMixin
):

    XLSX_MIME = (
        "application/vnd.openxmlformats-officedocument" ".spreadsheetml.sheet"
    )

    def setUp(self):
        super().setUp()
        call_command("administration_seeder", "--test")
        call_command("download_all_administrations", "--test")
        call_command("entities_seeder", "--test", True)
        self.user = self.create_user("test@akvo.org", self.ROLE_ADMIN)
        self.token = self.get_auth_token(self.user.email)
        self.adm = Administration.objects.filter(path__isnull=False)

    def test_export_entity_template(self):
        entity_type = Entity.objects.order_by('?').first()
        api_url = "/api/v1/export/entity-data-template"
        response = cast(
            Response,
            self.client.get(
                f"{api_url}?entity_ids={entity_type.id}",
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            ),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], self.XLSX_MIME)

        df = pd.read_excel(response.content, sheet_name=entity_type.name)
        level_names = list(Levels.objects.order_by("level").values_list(
            "name", flat=True
        ))
        static_columns = ['Name', 'Code']
        expected = static_columns + level_names
        actual = [val for val in list(df)]
        self.assertCountEqual(
            sorted(expected),
            sorted(actual)
        )

    def test_export_prefilled_entity_without_selected_adm_template(self):
        entity_type = Entity.objects.order_by('?').first()
        api_url = "/api/v1/export/prefilled-entity-data-template"
        response = cast(
            Response,
            self.client.get(
                f"{api_url}?entity_ids={entity_type.id}",
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            ),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], self.XLSX_MIME)

        df = pd.read_excel(response.content, sheet_name=entity_type.name)
        last_record = df.tail(1).to_dict("records")[0]
        last_adm = Administration.objects.order_by('-id').first()
        # check the last record equal with last administration
        self.assertEqual(last_record["Village"], last_adm.name)

    def test_export_prefilled_entity_with_selected_adm_template(self):
        entity_type = Entity.objects.order_by('?').first()
        api_url = "/api/v1/export/prefilled-entity-data-template"
        lowest_level = Levels.objects.order_by('-level').first()
        adm = Administration.objects.filter(
            level=lowest_level
        ).first()
        response = cast(
            Response,
            self.client.get(
                f"{api_url}?entity_ids={entity_type.id}&adm_id={adm.id}",
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            ),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], self.XLSX_MIME)

        df = pd.read_excel(response.content, sheet_name=entity_type.name)
        self.assertEqual(df.iloc[0]["Village"], adm.name)
