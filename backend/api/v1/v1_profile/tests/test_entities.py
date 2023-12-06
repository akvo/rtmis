from typing import cast
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.response import Response
from api.v1.v1_profile.models import Administration, Entity, EntityData

from api.v1.v1_profile.tests.mixins import ProfileTestHelperMixin


@override_settings(USE_TZ=False)
class EntityTestCase(TestCase, ProfileTestHelperMixin):
    def setUp(self):
        super().setUp()
        call_command("administration_seeder", "--test")
        self.user = self.create_user('test@akvo.org', self.ROLE_ADMIN)
        self.token = self.get_auth_token(self.user.email)

    def test_list(self):
        for n in range(3):
            Entity.objects.create(name=f'entity #{n+1}')
        response = cast(Response, self.client.get(
            "/api/v1/entities",
            content_type="application/json",
            HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(len(body.get('data')), 3)
        self.assertEqual(body.get('total'), 3)
        self.assertEqual(body.get('current'), 1)
        self.assertEqual(body.get('total_page'), 1)

    def test_create(self):
        payload = {'name': 'test entity'}
        response = cast(Response, self.client.post(
            "/api/v1/entities",
            payload,
            content_type="application/json",
            HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Entity.objects.filter(name='test entity').exists())

    def test_retrieve(self):
        entity = Entity.objects.create(name='test entity')
        response = cast(Response, self.client.get(
            f"/api/v1/entities/{entity.id}",
            content_type="application/json",
            HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('id'), entity.id)
        self.assertEqual(data.get('name'), entity.name)

    def test_update(self):
        entity = Entity.objects.create(name='test entity')
        payload = {'name': 'test update'}
        response = cast(Response, self.client.put(
            f"/api/v1/entities/{entity.id}",
            payload,
            content_type="application/json",
            HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('name'), payload['name'])
        updated = Entity.objects.get(id=entity.id)
        self.assertEqual(updated.name, data.get('name'))

    def test_delete(self):
        entity = Entity.objects.create(name='test entity')
        response = cast(Response, self.client.delete(
            f"/api/v1/entities/{entity.id}",
            content_type="application/json",
            HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Entity.objects.filter(id=entity.id).exists())


@override_settings(USE_TZ=False)
class EntityDataTestCase(TestCase, ProfileTestHelperMixin):
    def setUp(self):
        super().setUp()
        call_command("administration_seeder", "--test")
        for n in range(2):
            Entity.objects.create(name=f'entity #{n+1}')
        self.user = self.create_user('test@akvo.org', self.ROLE_ADMIN)
        self.token = self.get_auth_token(self.user.email)

    def test_list(self):
        administration = Administration.objects.last()
        entity = Entity.objects.last()
        for n in range(4):
            EntityData.objects.create(
                    name=f'entity data #{n+1}',
                    code=f'code{n}',
                    administration=administration,
                    entity=entity)
        response = cast(Response, self.client.get(
            "/api/v1/entity-data",
            content_type="application/json",
            HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(len(body.get('data')), 4)
        self.assertEqual(body.get('total'), 4)
        self.assertEqual(body.get('current'), 1)
        self.assertEqual(body.get('total_page'), 1)

    def test_create(self):
        administration = Administration.objects.last()
        entity = Entity.objects.first()
        payload = {
            'name': 'test entity data',
            'administration': administration.id,
            'entity': entity.id
        }
        response = cast(Response, self.client.post(
            "/api/v1/entity-data",
            payload,
            content_type="application/json",
            HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 201)
        created = EntityData.objects.get(name=payload['name'])
        self.assertIsNone(created.code)
        self.assertEqual(created.administration, administration)
        self.assertEqual(created.entity, entity)

    def test_retrieve(self):
        data = EntityData.objects.create(
            name='test',
            administration=Administration.objects.last(),
            entity=Entity.objects.first()
        )
        response = cast(Response, self.client.get(
            f"/api/v1/entity-data/{data.id}",
            content_type="application/json",
            HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data.get('id'), data.id)
        self.assertEqual(json_data.get('name'), data.name)

    def test_update(self):
        data = EntityData.objects.create(
            name='test',
            administration=Administration.objects.first(),
            entity=Entity.objects.first()
        )
        administration = Administration.objects.last()
        entity = Entity.objects.last()
        payload = {
            'name': 'updated',
            'code': 'T2',
            'administration': administration.id,
            'entity': entity.id,
        }
        response = cast(Response, self.client.put(
            f"/api/v1/entity-data/{data.id}",
            payload,
            content_type="application/json",
            HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 200)
        updated = EntityData.objects.get(id=data.id)
        self.assertEqual(updated.name, payload['name'])
        self.assertEqual(updated.code, payload['code'])
        self.assertEqual(updated.administration, administration)
        self.assertEqual(updated.entity, entity)

    def test_delete(self):
        data = EntityData.objects.create(
            name='test',
            administration=Administration.objects.first(),
            entity=Entity.objects.first()
        )
        response = cast(Response, self.client.delete(
            f"/api/v1/entity-data/{data.id}",
            content_type="application/json",
            HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 204)
        self.assertFalse(EntityData.objects.filter(id=data.id).exists())
