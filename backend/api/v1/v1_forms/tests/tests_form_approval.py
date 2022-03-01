from django.core.management import call_command
from django.test import TestCase
from rest_framework_simplejwt.tokens import RefreshToken

from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_users.models import SystemUser


class FormApprovalTestCase(TestCase):
    def test_approval_endpoint(self):
        call_command("form_seeder", "--test")
        call_command("administration_seeder", "--test")
        call_command("form_approval_seeder")
        user_payload = {"email": "admin@rtmis.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        user = user_response.json()
        token = user.get('token')
        header = {
            'HTTP_AUTHORIZATION': f'Bearer {token}'
        }
        response = self.client.get('/api/v1/form/approval-level/',
                                   content_type='application/json',
                                   **header)
        self.assertEqual(403, response.status_code)
        call_command("fake_user_seeder", "-r", 10)
        admin_user = SystemUser.objects.filter(
            user_access__role=UserRoleTypes.admin).first()
        if admin_user:
            t = RefreshToken.for_user(admin_user)
            header = {
                'HTTP_AUTHORIZATION': f'Bearer {t.access_token}'
            }
            response = self.client.get('/api/v1/form/approval-level/',
                                       content_type='application/json',
                                       **header)
            self.assertEqual(200, response.status_code)
        header = {
            'HTTP_AUTHORIZATION': f'Bearer {token}'
        }

        response = self.client.get('/api/v1/admin/form/approval-level/1/',
                                   content_type='application/json',
                                   **header)
        self.assertEqual(200, response.status_code)
        response = self.client.get(
            '/api/v1/form/approver/?administration_id=1&form_id=1',
            content_type='application/json',
            **header)
        self.assertEqual(200, response.status_code)
