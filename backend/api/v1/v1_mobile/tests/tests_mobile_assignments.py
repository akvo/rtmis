import typing
from django.core.management import call_command
from django.http import HttpResponse
from django.test import TestCase, override_settings
from api.v1.v1_forms.models import Forms
from api.v1.v1_mobile.models import MobileAssignment
from api.v1.v1_profile.models import Administration, EntityData

from api.v1.v1_profile.tests.mixins import ProfileTestHelperMixin
from utils.custom_helper import CustomPasscode


@override_settings(USE_TZ=False)
class MobileAssignmentTestCase(TestCase, ProfileTestHelperMixin):

    def setUp(self):
        super().setUp()
        call_command("administration_seeder", "--test")
        call_command('form_seeder', '--test')
        call_command("entities_seeder", "-t", True)
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

    def test_list_shows_only_created_by_user(self):
        other_user = self.create_user('otheruser@akvo.org', self.ROLE_ADMIN)
        assignment1 = MobileAssignment.objects.create_assignment(
                user=other_user, name='assignment #1')
        assignment2 = MobileAssignment.objects.create_assignment(
                user=self.user, name='assignment #2')
        assignment3 = MobileAssignment.objects.create_assignment(
                user=other_user, name='assignment #3')

        response = typing.cast(
                HttpResponse,
                self.client.get(
                    '/api/v1/mobile-assignments',
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        data = response.json().get('data')
        ids = [it['id'] for it in data]
        self.assertIn(assignment2.id, ids)
        self.assertNotIn(assignment1.id, ids)
        self.assertNotIn(assignment3.id, ids)

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
        assignment = MobileAssignment.objects.get(name='test assignment')
        self.assertEqual(
                CustomPasscode().encode(data['passcode']), assignment.passcode)
        self.assertEqual(len(data['forms']), assignment.forms.count())
        self.assertEqual(
                len(data['administrations']),
                assignment.administrations.count())

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

    def test_create_error_entity_validation(self):
        adms = Administration.objects \
            .filter(entity_data__isnull=True).all()
        adm_ids = [a.id for a in adms]
        adm = Administration.objects.filter(pk__in=adm_ids).first()
        form = Forms.objects.get(pk=2)
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

        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertEqual(data, {
            'forms': [{
                'form': '2',
                'entity': 'School',
                'exists': 'True'
            }]})

    def test_create_success_entity_validation(self):
        entity = EntityData.objects.last()
        adm = entity.administration
        form = Forms.objects.get(pk=2)
        payload = {
            'name': 'secret',
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
        assignment = MobileAssignment.objects.get(name='secret')
        self.assertEqual(
                CustomPasscode().encode(data['passcode']), assignment.passcode)
        self.assertEqual(data['forms'], [{'id': form.id, 'name': form.name}])
        self.assertEqual(
                len(data['administrations']),
                assignment.administrations.count())

    def test_create_with_certifications(self):
        adm = Administration.objects.first()
        form = Forms.objects.get(pk=2)
        payload = {
            'name': 'test assignment',
            'forms': [form.id],
            'administrations': [adm.id],
            'certifications': [adm.id]
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
        assignment = MobileAssignment.objects.get(name='test assignment')
        self.assertEqual(
                CustomPasscode().encode(data['passcode']), assignment.passcode)
        self.assertEqual(len(data['forms']), assignment.forms.count())
        self.assertEqual(
                len(data['certifications']),
                assignment.administrations.count())

        # Test mobile authentication with certifications

        code = {'code': data["passcode"]}
        auth = typing.cast(
                HttpResponse,
                self.client.post(
                    '/api/v1/device/auth',
                    code,
                    content_type='application/json'))

        self.assertEqual(auth.status_code, 200)
        data = auth.json()
        self.assertEqual(data['certifications'], [adm.id])

        # Test delete certifications via update
        payload = {
            'name': 'test assignment',
            'forms': [form.id],
            'administrations': [adm.id],
            'certifications': []
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
        assignment = MobileAssignment.objects.get(name='test assignment')
        self.assertEqual(len(data['certifications']), 0)
