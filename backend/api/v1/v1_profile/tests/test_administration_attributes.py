import typing
from django.core.management import call_command
from django.http import HttpResponse
from django.test import TestCase, override_settings
from api.v1.v1_profile.models import AdministrationAttribute

from api.v1.v1_profile.tests.mixins import ProfileTestHelperMixin


@override_settings(USE_TZ=False)
class AdministrationAttributeTestCase(TestCase, ProfileTestHelperMixin):

    def setUp(self) -> None:
        super().setUp()
        call_command("administration_seeder", "--test")
        self.user = self.create_user("test@akvo.org", self.ROLE_ADMIN)
        self.token = self.get_auth_token(self.user.email)

    def test_list(self):
        AdministrationAttribute.objects.create(name="attribute #1")
        AdministrationAttribute.objects.create(
            name="attribute #2",
            type=AdministrationAttribute.Type.OPTION,
            options=["opt #1", "opt #2"],
        )

        response = typing.cast(
            HttpResponse,
            self.client.get(
                "/api/v1/administration-attributes",
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            ),
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)

    def test_create_value_attribute(self):
        payload = {
            "name": "test attribute",
            "type": "value",
        }
        response = typing.cast(
            HttpResponse,
            self.client.post(
                "/api/v1/administration-attributes",
                payload,
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            ),
        )
        self.assertEqual(response.status_code, 201)

    def test_create_value_attribute_with_empty_options(self):
        payload = {
            "name": "test attribute",
            "type": "value",
            "options": [],
        }
        response = typing.cast(
            HttpResponse,
            self.client.post(
                "/api/v1/administration-attributes",
                payload,
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            ),
        )
        self.assertEqual(response.status_code, 201)

    def test_create_invalid_value_attribute(self):
        payload = {
            "name": "test attribute",
            "type": "value",
            "options": ["invalid"],
        }
        response = typing.cast(
            HttpResponse,
            self.client.post(
                "/api/v1/administration-attributes",
                payload,
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            ),
        )
        self.assertEqual(response.status_code, 400)

    def test_create_option_attribute(self):
        payload = {
            "name": "option attribute",
            "type": "option",
            "options": ["opt #1", "opt #2"],
        }
        response = typing.cast(
            HttpResponse,
            self.client.post(
                "/api/v1/administration-attributes",
                payload,
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            ),
        )
        self.assertEqual(response.status_code, 201)

    def test_create_invalid_option_attribute(self):
        payload = {
            "name": "option attribute",
            "type": "option",
            "options": [],
        }
        response = typing.cast(
            HttpResponse,
            self.client.post(
                "/api/v1/administration-attributes",
                payload,
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            ),
        )
        self.assertEqual(response.status_code, 400)

    def test_create_multiple_option_attribute(self):
        payload = {
            "name": "option attribute",
            "type": "multiple_option",
            "options": ["opt #1", "opt #2"],
        }
        response = typing.cast(
            HttpResponse,
            self.client.post(
                "/api/v1/administration-attributes",
                payload,
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            ),
        )
        self.assertEqual(response.status_code, 201)

    def test_create_invalid_multiple_option_attribute(self):
        payload = {
            "name": "option attribute",
            "type": "multiple_option",
            "options": [],
        }
        response = typing.cast(
            HttpResponse,
            self.client.post(
                "/api/v1/administration-attributes",
                payload,
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            ),
        )
        self.assertEqual(response.status_code, 400)

    def test_create_aggregate_attribute(self):
        payload = {
            "name": "option attribute",
            "type": "aggregate",
            "options": ["opt #1", "opt #2"],
        }
        response = typing.cast(
            HttpResponse,
            self.client.post(
                "/api/v1/administration-attributes",
                payload,
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            ),
        )
        self.assertEqual(response.status_code, 201)

    def test_create_invalid_aggregate_attribute(self):
        payload = {
            "name": "option attribute",
            "type": "aggregate",
            "options": [],
        }
        response = typing.cast(
            HttpResponse,
            self.client.post(
                "/api/v1/administration-attributes",
                payload,
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            ),
        )
        self.assertEqual(response.status_code, 400)

    def test_update(self):
        test_att = AdministrationAttribute.objects.create(
            name="test",
            type=AdministrationAttribute.Type.OPTION,
            options=["opt #1"],
        )
        payload = {
            "name": "renamed",
            "type": "aggregate",
            "options": ["opt #2"],
        }

        response = typing.cast(
            HttpResponse,
            self.client.put(
                f"/api/v1/administration-attributes/{test_att.id}",
                payload,
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            ),
        )

        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data.get("name"), "renamed")
        self.assertEqual(data.get("type"), "aggregate")
        self.assertEqual(data.get("options"), ["opt #2"])

    def test_delete(self):
        test_att = AdministrationAttribute.objects.create(name="attribute #1")
        response = typing.cast(
            HttpResponse,
            self.client.delete(
                f"/api/v1/administration-attributes/{test_att.id}",
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {self.token}",
            ),
        )

        self.assertEqual(response.status_code, 204)
        self.assertFalse(
            AdministrationAttribute.objects.filter(id=test_att.id).exists()
        )

    def test_run_administration_attribute_seeder(self):
        call_command("administration_attribute_seeder", "--test")
