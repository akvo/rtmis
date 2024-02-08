from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from rest_framework_simplejwt.tokens import RefreshToken

from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_users.models import SystemUser


@override_settings(USE_TZ=False)
class FormApprovalTestCase(TestCase):

    def test_approval_endpoint(self):
        call_command("form_seeder", "--test")
        call_command("administration_seeder", "--test")
        call_command("form_approval_seeder")
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        user = user_response.json()
        token = user.get('token')
        header = {
            'HTTP_AUTHORIZATION': f'Bearer {token}'
        }
        response = self.client.get(
            '/api/v1/form/approver/?administration_id=1&form_id=1',
            content_type='application/json',
            **header)
        self.assertEqual(200, response.status_code)
        self.assertEqual(list(response.json()[0]),
                         ['user', 'administration'])

        # check form approval endpoint
        user = SystemUser.objects.filter(
            user_access__role=UserRoleTypes.user).first()
        if user:
            user = RefreshToken.for_user(user)

            header = {
                'HTTP_AUTHORIZATION': f'Bearer {token}'
            }
            response = self.client.get(
                '/api/v1/form/check-approver/1',
                content_type='application/json',
                **header)
            self.assertEqual(200, response.status_code)
            self.assertEqual(list(response.json()), ['count'])
