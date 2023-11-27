import typing
from django.core.management import call_command
from django.http import HttpResponse
from django.test import TestCase, override_settings

from api.v1.v1_profile.models import (
        Administration, AdministrationAttribute, Levels)
from api.v1.v1_profile.tests.mixins import ProfileTestHelperMixin


@override_settings(USE_TZ=False)
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

    def test_delete_administration_that_have_relations(self):
        root = Administration.objects.get(id=1)
        response = typing.cast(
                HttpResponse,
                self.client.delete(
                    f"/api/v1/administrations/{root.id}",
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 409)
        body = response.json()
        self.assertIn('error', body)
        self.assertIn('referenced_by', body)


@override_settings(USE_TZ=False)
class AdministrationAttributeValueTestCase(TestCase, ProfileTestHelperMixin):
    def setUp(self) -> None:
        super().setUp()
        call_command("administration_seeder", "--test")
        self.reset_db_sequence(Administration)
        self.user = self.create_user('test@akvo.org', self.ROLE_ADMIN)
        self.token = self.get_auth_token(self.user.email)
        self.value_att = AdministrationAttribute.objects.create(
                name='value attribute')
        self.option_att = AdministrationAttribute.objects.create(
                name='option attribute',
                type=AdministrationAttribute.Type.OPTION,
                options=['opt #1', 'opt #2'])
        self.multiple_option_att = AdministrationAttribute.objects.create(
                name='multiple option attribute',
                type=AdministrationAttribute.Type.MULTIPLE_OPTION,
                options=['opt #1', 'opt #2'])
        self.aggregate_att = AdministrationAttribute.objects.create(
                name='aggregate attribute',
                type=AdministrationAttribute.Type.AGGREGATE,
                options=['opt #1', 'opt #2'])

    def test_get_administration_with_attributes(self):
        adm = Administration.objects.get(id=1)
        adm.attributes.create(attribute=self.value_att, value={'value': '1'})
        adm.attributes.create(
                attribute=self.option_att,
                value={'value': 'opt #1'})
        adm.attributes.create(
                attribute=self.multiple_option_att,
                value={'value': ['opt #1']})
        adm.attributes.create(
                attribute=self.aggregate_att,
                value={'value': {'opt #1': '1', 'opt #2': '2'}})
        response = typing.cast(
                HttpResponse,
                self.client.get(
                    f"/api/v1/administrations/{adm.id}",
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(len(body.get('attributes')), 4)

    def test_create(self):
        adm = Administration.objects.get(level__level=1)
        payload = {
            'parent': adm.id,
            'name': 'Test',
            'code': 'T',
            'attributes': [
                {
                    'attribute': self.value_att.id,
                    'value': 1,
                },
                {
                    'attribute': self.option_att.id,
                    'value': 'opt #1',
                },
                {
                    'attribute': self.multiple_option_att.id,
                    'value': ['opt #2'],
                },
                {
                    'attribute': self.aggregate_att.id,
                    'value': {'opt #1': 1, 'opt #2': None},
                },
            ]
        }
        response = typing.cast(
                HttpResponse,
                self.client.post(
                    "/api/v1/administrations",
                    payload,
                    content_type='application/json',
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 201)
        created = Administration.objects.get(name='Test')
        self.assertEqual(
            created.attributes.get(
                attribute=self.value_att).value.get('value'),
            1)
        self.assertEqual(
            created.attributes.get(
                attribute=self.option_att).value.get('value'),
            'opt #1')
        self.assertEqual(
            created.attributes.get(
                attribute=self.multiple_option_att).value.get('value'),
            ['opt #2'])
        self.assertEqual(
            created.attributes.get(
                attribute=self.aggregate_att).value.get('value'),
            {'opt #1': 1, 'opt #2': None})

    def test_create_invalid_value_attribute(self):
        adm = Administration.objects.get(level__level=1)
        payload = {
            'parent': adm.id,
            'name': 'Test',
            'code': 'T',
            'attributes': [
                {'attribute': self.value_att.id, 'value': ['invalid']},
            ]
        }
        response = typing.cast(
                HttpResponse,
                self.client.post(
                    "/api/v1/administrations",
                    payload,
                    content_type='application/json',
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertIn('attributes', body)

    def test_create_invalid_option_attribute(self):
        adm = Administration.objects.get(level__level=1)
        payload = {
            'parent': adm.id,
            'name': 'Test',
            'code': 'T',
            'attributes': [
                {
                    'attribute': self.option_att.id,
                    'value': 'opt #3',
                },
            ]
        }
        response = typing.cast(
                HttpResponse,
                self.client.post(
                    "/api/v1/administrations",
                    payload,
                    content_type='application/json',
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertIn('attributes', body)

    def test_create_invalid_multiple_options_attribute(self):
        adm = Administration.objects.get(level__level=1)
        payload = {
            'parent': adm.id,
            'name': 'Test',
            'code': 'T',
            'attributes': [
                {
                    'attribute': self.multiple_option_att.id,
                    'value': ['opt #3'],
                },
            ]
        }
        response = typing.cast(
                HttpResponse,
                self.client.post(
                    "/api/v1/administrations",
                    payload,
                    content_type='application/json',
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertIn('attributes', body)

    def test_create_invalid_aggregate_attribute(self):
        adm = Administration.objects.get(level__level=1)
        payload = {
            'parent': adm.id,
            'name': 'Test',
            'code': 'T',
            'attributes': [
                {
                    'attribute': self.aggregate_att.id,
                    'value': {'opt #3': 1},
                },
            ]
        }
        response = typing.cast(
                HttpResponse,
                self.client.post(
                    "/api/v1/administrations",
                    payload,
                    content_type='application/json',
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertIn('attributes', body)

    def test_update_attribute(self):
        adm = Administration.objects.get(id=1)
        adm.attributes.create(attribute=self.value_att, value={'value': '1'})
        payload = {
            'parent': adm.id,
            'name': adm.name,
            'code': adm.code,
            'attributes': [
                {
                    'attribute': self.value_att.id,
                    'value': 2,
                },
            ]
        }
        response = typing.cast(
                HttpResponse,
                self.client.put(
                    f"/api/v1/administrations/{adm.id}",
                    payload,
                    content_type='application/json',
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 200)
        updated = Administration.objects.get(id=adm.id)
        self.assertEqual(
            updated.attributes.get(
                attribute=self.value_att).value.get('value'),
            2)
