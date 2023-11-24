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
        self.user = self.create_user('test@akvo.org', self.ROLE_ADMIN)
        self.token = self.get_auth_token(self.user.email)

    def test_list(self):
        AdministrationAttribute.objects.create(name='attribute #1')
        AdministrationAttribute.objects.create(
                name='attribute #2',
                options=['opt #1', 'opt #2'])

        response = typing.cast(
                HttpResponse,
                self.client.get(
                    '/api/v1/administration-attributes',
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)

    def test_create(self):
        payload = {'name': 'test attribute', 'options': ['test option']}
        response = typing.cast(
                HttpResponse,
                self.client.post(
                    '/api/v1/administration-attributes',
                    payload,
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 201)

    def test_create_no_options(self):
        payload = {'name': 'test attribute'}
        response = typing.cast(
                HttpResponse,
                self.client.post(
                    '/api/v1/administration-attributes',
                    payload,
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 201)

    def test_create_with_empty_list_options(self):
        payload = {'name': 'test attribute', 'options': []}
        response = typing.cast(
                HttpResponse,
                self.client.post(
                    '/api/v1/administration-attributes',
                    payload,
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 201)

    def test_update(self):
        test_att = AdministrationAttribute.objects.create(
                name='attribute #1',
                options=['opt #1'])
        payload = {
            'name': 'renamed',
            'options': ['opt #2']
        }

        response = typing.cast(
                HttpResponse,
                self.client.put(
                    f'/api/v1/administration-attributes/{test_att.id}',
                    payload,
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('name'), 'renamed')
        self.assertEqual(data.get('options'), ['opt #2'])

    def test_delete(self):
        test_att = AdministrationAttribute.objects.create(name='attribute #1')
        response = typing.cast(
                HttpResponse,
                self.client.delete(
                    f'/api/v1/administration-attributes/{test_att.id}',
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 204)
        self.assertFalse(
            AdministrationAttribute.objects.filter(
                id=test_att.id
            ).exists()
        )
