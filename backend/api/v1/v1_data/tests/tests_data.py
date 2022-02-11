from django.core.management import call_command
from django.test import TestCase


class DataTestCase(TestCase):
    def test_list_form_data(self):
        self.maxDiff = None
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rtmis.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login/',
                                         user_payload,
                                         content_type='application/json')
        token = user_response.json().get('token')

        call_command("form_seeder", "--test")
        header = {
            'HTTP_AUTHORIZATION': f'Bearer {token}'
        }

        data = self.client.get(
            "/api/v1/list/form-data/1?page=1&administration=1", follow=True,
            **header)
        self.assertEqual(data.status_code, 200)
        data = self.client.get("/api/v1/list/form-data/1?page=2", follow=True,
                               **header)
        self.assertEqual(data.status_code, 404)
