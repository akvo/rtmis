import typing
import unittest
from django.core.management import call_command
from django.http import HttpResponse
from django.test import TestCase

from api.v1.v1_profile.models import Administration, Levels
from api.v1.v1_profile.tests.mixins import ProfileTestHelperMixin


class AdministrationTestCase(TestCase, ProfileTestHelperMixin):

    def setUp(self) -> None:
        super().setUp()
        call_command("administration_seeder", "--test")
        self.reset_db_sequence(Administration)
        self.user = self.create_user('test@akvo.org', self.ROLE_ADMIN)
        self.token = self.get_auth_token(self.user.email)

    def test_list(self):
        response = typing.cast(
                HttpResponse,
                self.client.get(
                    "/api/v1/administrations",
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(len(body.get('data')), 4)
        self.assertEqual(body.get('total'), 4)
        self.assertEqual(body.get('current'), 1)
        self.assertEqual(body.get('total_page'), 1)

    def test_create(self):
        level_2 = Levels.objects.get(level=2)
        adm_level_1 = Administration.objects.get(level__level=1)
        payload = {'parent': adm_level_1.id, 'name': 'Test', 'code': 'T'}

        response = typing.cast(
                HttpResponse,
                self.client.post(
                    "/api/v1/administrations",
                    payload,
                    content_type='application/json',
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 201)
        created = Administration.objects.get(name='Test')
        self.assertEqual(created.code, 'T')
        self.assertEqual(created.parent, adm_level_1)
        self.assertEqual(created.level, level_2)

    def test_create_without_parent(self):
        payload = {'name': 'Test', 'code': 'T'}

        response = typing.cast(
                HttpResponse,
                self.client.post(
                    "/api/v1/administrations",
                    payload,
                    content_type='application/json',
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertIn('parent', body)

    def test_create_with_invalid_level(self):
        adm_level_3 = Administration.objects.get(level__level=3)
        payload = {'parent': adm_level_3.id, 'name': 'Test', 'code': 'T'}

        response = typing.cast(
                HttpResponse,
                self.client.post(
                    "/api/v1/administrations",
                    payload,
                    content_type='application/json',
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertIn('parent', body)

    def test_retrieve(self):
        adm = Administration.objects.get(id=2)
        response = typing.cast(
                HttpResponse,
                self.client.get(
                    f"/api/v1/administrations/{adm.id}",
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('name'), adm.name)
        self.assertEqual(data.get('parent').get('name'), adm.parent.name)
        self.assertEqual(len(data.get('children')), 1)

    def test_update(self):
        level_2 = Levels.objects.get(level=2)
        level_3 = Levels.objects.get(level=3)
        adm_level_1 = Administration.objects.get(level__level=1)
        adm_level_2 = Administration.objects.get(level__level=2)
        test_adm = Administration.objects.create(
                parent=adm_level_2,
                name='Test',
                code='T',
                level=level_3)
        payload = {
            'parent': adm_level_1.id,
            'name': 'Test renamed',
            'code': 'TR'
        }

        response = typing.cast(
                HttpResponse,
                self.client.put(
                    f"/api/v1/administrations/{test_adm.id}",
                    payload,
                    content_type='application/json',
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 200)
        updated = Administration.objects.get(id=test_adm.id)
        self.assertEqual(updated.name, 'Test renamed')
        self.assertEqual(updated.code, 'TR')
        self.assertEqual(updated.parent, adm_level_1)
        self.assertEqual(updated.level, level_2)

    def test_delete(self):
        level_2 = Levels.objects.get(level=2)
        adm_level_1 = Administration.objects.get(level__level=1)
        test_adm = Administration.objects.create(
                parent=adm_level_1,
                name='Test',
                code='T',
                level=level_2)

        response = typing.cast(
                HttpResponse,
                self.client.delete(
                    f"/api/v1/administrations/{test_adm.id}",
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 204)
        self.assertFalse(
                Administration.objects.filter(id=test_adm.id).exists())

    @unittest.skip('TODO')
    def test_delete_administration_that_have_relations(self):
        ...
