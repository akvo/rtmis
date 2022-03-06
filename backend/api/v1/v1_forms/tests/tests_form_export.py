from django.core.management import call_command
from django.test import TestCase

from api.v1.v1_forms.models import Forms


class FormExportTestCase(TestCase):
    def test_export_form(self):
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")
        user_payload = {"email": "admin@rtmis.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        token = user_response.json().get('token')
        header = {
            'HTTP_AUTHORIZATION': f'Bearer {token}'
        }
        response = self.client.get(
            '/api/v1/export/form/{0}'.format(Forms.objects.first().id),
            content_type='application/json',
            **header)
        self.assertEqual(response.status_code, 200)
