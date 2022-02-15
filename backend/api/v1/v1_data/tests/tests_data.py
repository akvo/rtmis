from django.core.management import call_command
from django.test import TestCase

from api.v1.v1_data.models import FormData
from api.v1.v1_forms.models import Forms


class DataTestCase(TestCase):
    def test_list_form_data(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rtmis.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login/',
                                         user_payload,
                                         content_type='application/json')
        token = user_response.json().get('token')

        call_command("form_seeder", "--test")
        call_command("fake_data_seeder", "-r", 1, '-t', True)
        header = {
            'HTTP_AUTHORIZATION': f'Bearer {token}'
        }

        data = self.client.get(
            "/api/v1/list/form-data/1?page=1&administration=1", follow=True,
            **header)
        result = data.json()
        self.assertEqual(data.status_code, 200)
        self.assertEqual(list(result),
                         ['current', 'total', 'total_page', 'data'])
        self.assertEqual(list(result['data'][0]),
                         ['id', 'name', 'form', 'administration', 'geo',
                          'created_by', 'updated_by', 'created', 'updated',
                          'answer']
                         )
        self.assertEqual(list(result['data'][0]['answer'][0]),
                         ['history', 'question', 'value']
                         )

        data = self.client.get("/api/v1/list/form-data/1?page=2", follow=True,
                               **header)
        self.assertEqual(data.status_code, 404)

    def test_maps_data(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rtmis.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login/',
                                         user_payload,
                                         content_type='application/json')
        token = user_response.json().get('token')

        call_command("form_seeder", "--test")
        call_command("fake_data_seeder", "-r", 1, '-t', True)
        header = {
            'HTTP_AUTHORIZATION': f'Bearer {token}'
        }

        form = Forms.objects.first()
        print(form.form_questions.values_list('id'))

        data = self.client.get(
            "/api/v1/maps/{0}/".format(form.id), follow=True,
            **header)
        self.assertEqual(data.status_code, 400)
        data = self.client.get(
            "/api/v1/maps/{0}/?shape=1&marker=2".format(form.id), follow=True,
            **header)
        self.assertEqual(data.status_code, 200)
        self.assertEqual(list(data.json()[0]),
                         ['id', 'name', 'geo', 'marker', 'shape'])
        data = data.json()
        for d in data:
            form_data = FormData.objects.get(id=d.get('id'))
            self.assertEqual(d.get("name"), form_data.name)
            self.assertEqual(len(d.get("geo")), 2)
            self.assertIsNotNone(d.get("marker"))
            self.assertIsNotNone(d.get("shape"))
