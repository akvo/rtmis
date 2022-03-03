from django.core.management import call_command
from django.test import TestCase
from rest_framework_simplejwt.tokens import RefreshToken

from api.v1.v1_data.models import FormData, PendingFormData
from api.v1.v1_forms.models import Forms
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_users.models import SystemUser


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
                          'created_by', 'updated_by', 'created', 'updated']
                         )

        data = self.client.get("/api/v1/list/form-data/1?page=2", follow=True,
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
        header = {
            'HTTP_AUTHORIZATION': f'Bearer {token}'
        }

        form = Forms.objects.first()

        data = self.client.get(
            "/api/v1/maps/{0}".format(form.id), follow=True,
            **header)
        self.assertEqual(data.status_code, 400)
        data = self.client.get(
            "/api/v1/maps/{0}?shape=1&marker=2".format(form.id), follow=True,
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
        header = {
            'HTTP_AUTHORIZATION': f'Bearer {token}'
        }

        form = Forms.objects.first()

        data = self.client.get(
            "/api/v1/chart/data/{0}".format(form.id), follow=True,
            **header)
        self.assertEqual(data.status_code, 400)
        data = self.client.get(
            "/api/v1/chart/data/{0}?question=2".format(form.id), follow=True,
            **header)
        self.assertEqual(data.status_code, 200)
        self.assertEqual(list(data.json().get('data')[0]),
                         ['name', 'value'])
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

        call_command("fake_user_seeder", "-r", 10)
        call_command('form_approval_seeder')
        call_command('form_approval_assignment_seeder')
        call_command('fake_pending_data_seeder', '-r', 1, '-t', True)
        admin_user = SystemUser.objects.filter(
            user_access__role=UserRoleTypes.admin).first()
        if admin_user:
            t = RefreshToken.for_user(admin_user)
            header = {
                'HTTP_AUTHORIZATION': f'Bearer {t.access_token}'
            }
            response = self.client.get(
                '/api/v1/form-pending-data/{0}?page=1'.format(
                    Forms.objects.first().pk),
                content_type='application/json',
                **header)
            self.assertEqual(200, response.status_code)

            self.assertEqual(['current', 'total', 'total_page', 'data'],
                             list(response.json()))
            if response.json().get('total') > 0:
                data = response.json().get('data')
                self.assertEqual(
                    ['id', 'name', 'form', 'administration', 'geo',
                     'created_by', 'created', 'approver'],
                    list(data[0]))
                response = self.client.get(
                    '/api/v1/pending-data/{0}'.format(
                        data[0].get('id')),
                    content_type='application/json',
                    **header)
                self.assertEqual(200, response.status_code)
                self.assertEqual(['history', 'question', 'value'],
                                 list(response.json()[0]))

        values = list(
            PendingFormData.objects.all().values_list('id', flat=True))
        payload = {"name": "Test Batch", "data": values}
        response = self.client.post('/api/v1/batch',
                                    payload,
                                    content_type='application/json',
                                    **header)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get('message'),
                         'Data updated successfully')
        payload = {"name": "Test Batch", "data": values}
        response = self.client.post('/api/v1/batch',
                                    payload,
                                    content_type='application/json',
                                    **header)
        self.assertEqual(response.status_code, 400)

        response = self.client.get('/api/v1/list/batch',
                                   content_type='application/json',
                                   **header)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(list(response.json()[0]),
                         ['name', 'form', 'administration', 'file',
                          'total_data', 'created', 'updated'])
