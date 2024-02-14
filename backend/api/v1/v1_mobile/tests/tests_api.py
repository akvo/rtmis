from django.test import TestCase
from api.v1.v1_mobile.authentication import MobileAssignmentToken
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.models import Administration, Access
from api.v1.v1_profile.constants import UserRoleTypes
from django.core.management import call_command
from api.v1.v1_mobile.models import MobileAssignment
from api.v1.v1_forms.models import Forms
from rest_framework import status


class MobileAssignmentApiTest(TestCase):
    def setUp(self):
        call_command('administration_seeder', '--test')
        call_command('form_seeder', '--test')
        self.user = SystemUser.objects.create_user(
            email='test@test.org',
            password='test1234',
            first_name='test',
            last_name='testing',
        )
        self.administration = Administration.objects.filter(
            parent__isnull=True
        ).first()
        role = UserRoleTypes.user
        self.user_access = Access.objects.create(
            user=self.user, role=role, administration=self.administration
        )
        self.forms = Forms.objects.all()
        self.passcode = 'passcode1234'
        self.mobile_assignment = MobileAssignment.objects.create_assignment(
            user=self.user, name='test', passcode=self.passcode
        )
        self.administration_children = Administration.objects.filter(
            parent=self.administration
        ).all()
        self.mobile_assignment.administrations.add(
            *self.administration_children
        )
        self.mobile_assignment = MobileAssignment.objects.get(user=self.user)
        self.mobile_assignment.forms.add(*self.forms)

    def test_mobile_assignment_form_list_serializer(self):
        from api.v1.v1_mobile.serializers import (
            MobileAssignmentFormsSerializer,
        )

        serializer = MobileAssignmentFormsSerializer(self.mobile_assignment)
        syncToken = serializer.data['syncToken']
        token = MobileAssignmentToken(syncToken)

        self.assertEqual(token.assignment.id, self.mobile_assignment.id)
        self.assertEqual(
            dict(serializer.data['formsUrl'][0]),
            {
                'id': self.forms[0].id,
                'version': str(self.forms[0].version),
                'url': f'/form/{self.forms[0].id}',
            },
        )

    def test_mobile_assignment_form_api(self):
        code = {'code': self.passcode}
        response = self.client.post(
            '/api/v1/device/auth',
            code,
            content_type='application/json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        syncToken = response.data['syncToken']
        token = MobileAssignmentToken(syncToken)

        self.assertEqual(token.assignment.id, self.mobile_assignment.id)

        self.assertEqual(
            dict(response.data['formsUrl'][0]),
            {
                'id': self.forms[0].id,
                'version': str(self.forms[0].version),
                'url': f'/form/{self.forms[0].id}',
            },
        )
        self.assertEqual(self.mobile_assignment.last_synced_at, None)

    def test_mobile_assignment_form_api_with_invalid_passcode(self):
        # wrong passcode
        code = {'code': 'wrong code'}
        response = self.client.post(
            '/api/v1/device/auth',
            code,
            content_type='application/json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # response should be error
        self.assertEqual(
            response.json(), {'error': {'code': ['Invalid passcode']}}
        )

    def test_get_individual_forms_with_token(self):
        # get token
        code = {'code': self.passcode}
        auth = self.client.post(
            '/api/v1/device/auth',
            code,
            content_type='application/json',
        )
        token = auth.data['syncToken']
        forms_url = auth.data['formsUrl']

        self.assertEqual(auth.status_code, status.HTTP_200_OK)
        self.assertEqual(forms_url[0]['url'], f'/form/{self.forms[0].id}')

        form_url = forms_url[0]['url']

        response = self.client.get(
            f'/api/v1/device{form_url}',
            follow=True,
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {token}'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            list(response.data),
            [
                'name',
                'version',
                'cascades',
                'question_group',
                'approval_instructions'
            ],
        )

    def test_assignment_token_no_access(self):
        code = {'code': self.passcode}
        auth = self.client.post(
            '/api/v1/device/auth',
            code,
            content_type='application/json',
        )
        token = auth.data['syncToken']
        response = self.client.get(
            '/api/v1/profile',
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {token}'},
        )
        self.assertEqual(response.status_code, 403)
