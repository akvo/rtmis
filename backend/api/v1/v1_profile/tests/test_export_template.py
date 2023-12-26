from typing import cast
from django.core.management import call_command
from django.http.response import HttpResponse
from django.test import TestCase
from django.test.utils import override_settings
from api.v1.v1_profile.models import AdministrationAttribute

from api.v1.v1_profile.tests.mixins import ProfileTestHelperMixin


@override_settings(USE_TZ=False)
class AdministrationBulkUploadTemplateExportTestCase(
        TestCase, ProfileTestHelperMixin):
    def setUp(self):
        super().setUp()
        call_command("administration_seeder", "--test")
        self.user = self.create_user('test@akvo.org', self.ROLE_ADMIN)
        self.token = self.get_auth_token(self.user.email)
        self.attribute1 = AdministrationAttribute.objects.create(
                name='attribute #1')
        self.attribute2 = AdministrationAttribute.objects.create(
                name='attribute #2')

    def test_export_template(self):
        # self.fail('TODO')
        response = cast(
                HttpResponse,
                self.client.get(
                    '/api/v1/export/administrations-template',
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 200)

    def test_with_attribute(self):
        response = cast(
                HttpResponse,
                self.client.get(
                    ('/api/v1/export/administrations-template'
                     f'?attributes={self.attribute1.id},{self.attribute2.id}'),
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 200)
