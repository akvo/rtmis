import pandas as pd
from typing import cast
from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from rest_framework.response import Response
from api.v1.v1_profile.models import AdministrationAttribute, Levels

from api.v1.v1_profile.tests.mixins import ProfileTestHelperMixin


@override_settings(USE_TZ=False)
class AdministrationBulkUploadTemplateExportTestCase(
    TestCase, ProfileTestHelperMixin
):

    XLSX_MIME = (
        "application/vnd.openxmlformats-officedocument" ".spreadsheetml.sheet"
    )

    def setUp(self):
        super().setUp()
        call_command("administration_seeder", "--test")
        self.user = self.create_user("test@akvo.org", self.ROLE_ADMIN)
        self.token = self.get_auth_token(self.user.email)
        self.attribute1 = AdministrationAttribute.objects.create(
            name="attribute #1"
        )
        self.attribute2 = AdministrationAttribute.objects.create(
            name="attribute #2",
            type=AdministrationAttribute.Type.AGGREGATE,
            options=["opt #1", "opt #2"],
        )

    def test_export_template(self):
        response = cast(
            Response,
            self.client.get(
                "/api/v1/export/administrations-template",
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            ),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], self.XLSX_MIME)
        df = pd.read_excel(response.content, sheet_name="data")
        expected = [
            f"{lvl.id}|{lvl.name}"
            for lvl in Levels.objects.order_by("level").all()
        ]
        actual = [val for val in list(df)]
        self.assertEqual(expected, actual)

    def test_with_attribute(self):
        response = cast(
            Response,
            self.client.get(
                (
                    "/api/v1/export/administrations-template"
                    f"?attributes={self.attribute1.id},{self.attribute2.id}"
                ),
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            ),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], self.XLSX_MIME)
        df = pd.read_excel(response.content, sheet_name="data")
        levels = [f"{lvl.id}|{lvl.name}" for lvl in Levels.objects.all()]
        attributes = [
            f"{self.attribute1.id}|{self.attribute1.name}",
            f"{self.attribute2.id}|{self.attribute2.name}|opt #1",
            f"{self.attribute2.id}|{self.attribute2.name}|opt #2",
        ]
        expected = levels + attributes
        actual = [val for val in list(df)]
        self.assertEqual(expected, actual)
