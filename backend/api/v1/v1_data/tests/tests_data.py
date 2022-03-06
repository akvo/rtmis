from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings

from api.v1.v1_data.models import FormData
from api.v1.v1_forms.models import Forms


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
            "/api/v1/list/form-data/1?page=1&administration=1",
            follow=True,
            **header)
        result = data.json()
        self.assertEqual(data.status_code, 200)
        self.assertEqual(list(result),
                         ['current', 'total', 'total_page', 'data'])
        self.assertEqual(list(result['data'][0]), [
            'id', 'name', 'form', 'administration', 'geo', 'created_by',
            'updated_by', 'created', 'updated'
        ])

        data = self.client.get("/api/v1/list/form-data/1?page=2",
                               follow=True,
                               **header)
        self.assertEqual(data.status_code, 404)

    def test_maps_data(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rtmis.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        token = user_response.json().get('token')

        call_command("form_seeder", "--test")
        call_command("fake_data_seeder", "-r", 1, '-t', True)
        header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        form = Forms.objects.first()

        data = self.client.get("/api/v1/maps/{0}".format(form.id),
                               follow=True,
                               **header)
        self.assertEqual(data.status_code, 400)
        data = self.client.get("/api/v1/maps/{0}?shape=1&marker=2".format(
            form.id),
                               follow=True,
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

    def test_chart_data(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rtmis.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        token = user_response.json().get('token')

        call_command("form_seeder", "--test")
        call_command("fake_data_seeder", "-r", 1, '-t', True)
        header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        form = Forms.objects.first()

        data = self.client.get("/api/v1/chart/data/{0}".format(form.id),
                               follow=True,
                               **header)
        self.assertEqual(data.status_code, 400)
        data = self.client.get("/api/v1/chart/data/{0}?question=2".format(
            form.id),
                               follow=True,
                               **header)
        self.assertEqual(data.status_code, 200)
        self.assertEqual(list(data.json().get('data')[0]), ['name', 'value'])
        self.assertEqual(data.json().get('type'), 'BAR')
        data = self.client.get(
            "/api/v1/chart/data/{0}?question=2&stack=2".format(form.id),
            follow=True,
            **header)
        self.assertEqual(data.status_code, 200)
        self.assertEqual(data.json().get('type'), 'BARSTACK')
        self.assertEqual(list(data.json().get('data')[0]), ['group', 'child'])
        self.assertEqual(list(data.json().get('data')[0]['child'][0]),
                         ['name', 'value'])
