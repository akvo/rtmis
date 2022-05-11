from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings


@override_settings(USE_TZ=False)
class DataTestCase(TestCase):
    def test_list_form_data(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rtmis.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        token = user_response.json().get('token')

        call_command("form_seeder", "--test")
        call_command("fake_data_seeder", "-r", 1, '-t', True)
        header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        data = self.client.get(
            "/api/v1/form-data/1?page=1&administration=1",
            follow=True,
            **header)
        result = data.json()
        self.assertEqual(data.status_code, 200)
        self.assertEqual(list(result),
                         ['current', 'total', 'total_page', 'data'])
        self.assertEqual(list(result['data'][0]), [
            'id', 'name', 'form', 'administration', 'geo', 'created_by',
            'updated_by', 'created', 'updated', 'pending_data'
        ])

        data = self.client.get("/api/v1/form-data/1?page=2",
                               follow=True,
                               **header)
        self.assertEqual(data.status_code, 404)
