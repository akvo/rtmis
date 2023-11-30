import typing
from django.core.management import call_command
from django.http import HttpResponse
from django.test import TestCase, override_settings
from api.v1.v1_forms.models import Forms
from api.v1.v1_mobile.models import MobileAssignment
from api.v1.v1_profile.models import Administration

from api.v1.v1_profile.tests.mixins import ProfileTestHelperMixin


@override_settings(USE_TZ=False)
class MobileAssignmentTestCase(TestCase, ProfileTestHelperMixin):

    def setUp(self):
        super().setUp()
        call_command("administration_seeder", "--test")
        call_command('form_seeder', '--test')
        self.user = self.create_user('test@akvo.org', self.ROLE_ADMIN)
        self.token = self.get_auth_token(self.user.email)

    def test_list(self):
        adm1 = Administration.objects.first()
        adm2 = Administration.objects.all()[1]
        adm3 = Administration.objects.last()
        form1 = Forms.objects.first()
        form2 = Forms.objects.last()
        assignment1 = MobileAssignment.objects.create_assignment(
                user=self.user, name='assignment #1')
        assignment1.forms.add(form1)
        assignment1.administrations.add(adm1, adm2)
        assignment2 = MobileAssignment.objects.create_assignment(
                user=self.user, name='assignment #2')
        assignment2.forms.add(form2)
        assignment2.administrations.add(adm1, adm3)

        response = typing.cast(
                HttpResponse,
                self.client.get(
                    '/api/v1/mobile-assignments',
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(len(body['data']), 2)

    def test_create(self):
        adm = Administration.objects.first()
        form = Forms.objects.first()
        payload = {
            'name': 'test assignment',
            'forms': [form.id],
            'administrations': [adm.id],
        }

        response = typing.cast(
                HttpResponse,
                self.client.post(
                    '/api/v1/mobile-assignments',
                    payload,
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(len(data['passcode']) > 0)
        self.assertEqual(len(data['forms']), 1)
        self.assertEqual(len(data['administrations']), 1)

    def test_update(self):
        assignment = MobileAssignment.objects.create_assignment(
                user=self.user, name='assignment #1')
        adm = Administration.objects.first()
        form = Forms.objects.first()
        payload = {
            'name': 'renamed assignment',
            'forms': [form.id],
            'administrations': [adm.id],
        }

        response = typing.cast(
                HttpResponse,
                self.client.put(
                    f'/api/v1/mobile-assignments/{assignment.id}',
                    payload,
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['name'], 'renamed assignment')
        self.assertEqual(len(data['forms']), 1)
        self.assertEqual(len(data['administrations']), 1)

    def test_update_relations(self):
        adm1 = Administration.objects.first()
        adm2 = Administration.objects.all()[1]
        adm3 = Administration.objects.last()
        form1 = Forms.objects.first()
        form2 = Forms.objects.last()
        assignment = MobileAssignment.objects.create_assignment(
                user=self.user, name='assignment #1')
        assignment.forms.add(form1)
        assignment.administrations.add(adm1, adm2)
        payload = {
            'name': assignment.name,
            'forms': [form2.id],
            'administrations': [adm2.id, adm3.id],
        }
        response = typing.cast(
                HttpResponse,
                self.client.put(
                    f'/api/v1/mobile-assignments/{assignment.id}',
                    payload,
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual([it['id'] for it in data['forms']], [form2.id])
        self.assertEqual(
                [it['id'] for it in data['administrations']],
                [adm2.id, adm3.id])

    def test_delete(self):
        adm1 = Administration.objects.first()
        adm2 = Administration.objects.all()[1]
        form1 = Forms.objects.first()
        assignment = MobileAssignment.objects.create_assignment(
                user=self.user, name='assignment #1')
        assignment.forms.add(form1)
        assignment.administrations.add(adm1, adm2)

        response = typing.cast(
                HttpResponse,
                self.client.delete(
                    f'/api/v1/mobile-assignments/{assignment.id}',
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 204)
