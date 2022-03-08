from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from rest_framework_simplejwt.tokens import RefreshToken

from api.v1.v1_data.models import PendingFormData
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_users.models import SystemUser


@override_settings(USE_TZ=False)
class PendingDataTestCase(TestCase):
    def tests_pending_data(self):
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")
        call_command("fake_user_seeder", "-r", 100)
        call_command('form_approval_seeder')
        call_command('form_approval_assignment_seeder')
        call_command('fake_pending_data_seeder', '-r', 1, '-t', True, '-b', 1)
        admin_user = SystemUser.objects.filter(
            user_access__role=UserRoleTypes.admin).first()
        if admin_user:
            t = RefreshToken.for_user(admin_user)
            header = {'HTTP_AUTHORIZATION': f'Bearer {t.access_token}'}
            response = self.client.get(
                '/api/v1/form-pending-batch?page=1',
                content_type='application/json',
                **header)
            self.assertEqual(200, response.status_code)

            self.assertEqual(['current', 'total', 'total_page', 'batch'],
                             list(response.json()))
            if response.json().get('total') > 0:
                data = response.json().get('batch')
                self.assertEqual([
                    'id', 'name', 'form', 'administration', 'created_by',
                    'created', 'approver', 'approved'], list(data[0]))
                response = self.client.get('/api/v1/pending-data/{0}'.format(
                    data[0].get('id')),
                    content_type='application/json',
                    **header)
                self.assertEqual(200, response.status_code)
                self.assertEqual(['history', 'question', 'value'],
                                 list(response.json()[0]))
                response = self.client.get(
                    '/api/v1/form-pending-data-batch/{}'.format(data[0]['id']),
                    content_type='application/json',
                    **header)
                self.assertEqual(200, response.status_code)
                self.assertEqual(
                    ['id', 'name', 'form', 'administration', 'geo',
                     'created_by', 'created'], list(response.json()[0]))

        values = list(PendingFormData.objects.all().values_list('id',
                                                                flat=True))
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

        response = self.client.get('/api/v1/batch',
                                   content_type='application/json',
                                   **header)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(list(response.json()[0]), [
            'name', 'form', 'administration', 'file', 'total_data', 'created',
            'updated'
        ])
