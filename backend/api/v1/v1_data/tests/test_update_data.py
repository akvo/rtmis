from django.core.management import call_command
from django.test import TestCase
from django.core import signing

from api.v1.v1_forms.models import Forms
from api.v1.v1_forms.constants import FormTypes
from api.v1.v1_profile.models import Administration, Levels
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_users.models import SystemUser


def seed_administration_test():
    level = Levels(name="country", level=1)
    level.save()
    administration = Administration(id=1,
                                    name="Indonesia",
                                    parent=None,
                                    level=level)
    administration.save()
    administration = Administration(id=2,
                                    name="Jakarta",
                                    parent=administration,
                                    level=level)
    administration.save()


class FormDataUpdateTestCase(TestCase):
    def test_update_datapoint_by_admin_role(self):
        self.maxDiff = None
        seed_administration_test()
        user = {"email": "admin@rtmis.com", "password": "Test105*"}
        user = self.client.post('/api/v1/login',
                                user,
                                content_type='application/json')
        user = user.json()
        call_command("form_seeder", "--test")
        form = Forms.objects.first()
        self.assertEqual(form.id, 1)
        self.assertEqual(form.name, "Test Form")
        self.assertEqual(form.type, FormTypes.county)
        # Add data to edit
        payload = {
            "data": {
                "name": "Testing Data",
                "administration": 2,
                "geo": [6.2088, 106.8456]
            },
            "answer": [{
                "question": 101,
                "value": "Jane"
            }, {
                "question": 102,
                "value": ["Male"]
            }, {
                "question": 103,
                "value": 31208200175
            }, {
                "question": 104,
                "value": 2
            }, {
                "question": 105,
                "value": [6.2088, 106.8456]
            }, {
                "question": 106,
                "value": ["Parent", "Children"]
            }]
        }
        token = user.get("token")
        self.assertTrue(token)
        data = self.client.post('/api/v1/form-data/1/',
                                payload,
                                content_type='application/json',
                                **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data, {"message": "ok"})
        # Get all data from form
        data = self.client.get('/api/v1/form-data/1?page=1',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data['data']) > 0, True)
        data_id = data['data'][0]['id']  # get data_id here
        # Get answer from data
        data = self.client.get(f'/api/v1/data/{data_id}',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data) > 0, True)
        self.assertEqual(data[0]['question'], 101)
        self.assertEqual(data[0]['value'], 'Jane')
        self.assertEqual(data[0]['history'], False)
        self.assertEqual(data[1]['question'], 102)
        self.assertEqual(data[1]['value'], ['Male'])
        self.assertEqual(data[1]['history'], False)
        # Update data for question 101 and 102
        payload = {
            "data": {
                "name": "Update Testing Data",
                "administration": 2,
                "geo": [6.2088, 106.8456]
            },
            "answer": [{
                "question": 101,
                "value": "Jane Doe"
            }, {
                "question": 102,
                "value": ["Female"]
            }]
        }
        data = self.client.put(f'/api/v1/form-data/1?data_id={data_id}',
                               payload,
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data, {"message": "direct update success"})
        # Get all data from form
        data = self.client.get('/api/v1/form-data/1?page=1',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data['data']) > 0, True)
        self.assertEqual(data['data'][0]['name'], 'Update Testing Data')
        # Get answer from data with history
        data = self.client.get(f'/api/v1/data/{data_id}',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data) > 0, True)
        self.assertEqual(data[4]['question'], 101)
        self.assertEqual(data[4]['value'], 'Jane Doe')
        self.assertEqual(list(data[4]['history'][0]), [
            'value', 'created', 'created_by'])
        self.assertEqual(data[4]['history'][0]['value'], 'Jane')
        self.assertEqual(data[5]['question'], 102)
        self.assertEqual(data[5]['value'], ['Female'])
        self.assertEqual(list(data[5]['history'][0]), [
            'value', 'created', 'created_by'])
        self.assertEqual(data[5]['history'][0]['value'], ['Male'])

    def test_update_datapoint_by_data_entry_role(self):
        self.maxDiff = None
        seed_administration_test()
        call_command("form_seeder", "--test")

        form = Forms.objects.first()
        self.assertEqual(form.id, 1)
        self.assertEqual(form.name, "Test Form")
        self.assertEqual(form.type, FormTypes.county)

        user = {"email": "admin@rtmis.com", "password": "Test105*"}
        user = self.client.post('/api/v1/login',
                                user,
                                content_type='application/json')
        user = user.json()
        token = user.get('token')
        self.assertTrue(token)
        # Add data to edit
        payload = {
            "data": {
                "name": "Testing Data",
                "administration": 2,
                "geo": [6.2088, 106.8456]
            },
            "answer": [{
                "question": 101,
                "value": "Wayan"
            }, {
                "question": 102,
                "value": ["Female"]
            }, {
                "question": 103,
                "value": 31208200175
            }, {
                "question": 104,
                "value": 2
            }, {
                "question": 105,
                "value": [6.2088, 106.8456]
            }, {
                "question": 106,
                "value": ["Parent", "Children"]
            }]
        }
        data = self.client.post('/api/v1/form-data/1/',
                                payload,
                                content_type='application/json',
                                **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data, {"message": "ok"})
        # create non admin user/data entry user
        payload = {
            "first_name": "User",
            "last_name": "Wayan",
            "email": "wayan@example.com",
            "administration": 2,
            "forms": [1],
            "role": UserRoleTypes.user
        }
        header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        res = self.client.post("/api/v1/user",
                               payload,
                               content_type='application/json',
                               **header)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {'message': 'User added successfully'})
        data_entry = SystemUser.objects.filter(
            email="wayan@example.com").first()
        # check invitation
        invite_payload = signing.dumps(data_entry.pk)
        invite_response = self.client.get(
            '/api/v1/invitation/{0}'.format(invite_payload),
            content_type='application/json')
        self.assertEqual(invite_response.status_code, 200)
        self.assertEqual(invite_response.json(), {'name': "User Wayan"})
        # set password
        password_payload = {
            'invite': invite_payload,
            'password': 'Test123*',
            'confirm_password': 'Test123*'
        }
        invite_response = self.client.put('/api/v1/user/set-password',
                                          password_payload,
                                          content_type='application/json')
        self.assertEqual(invite_response.status_code, 200)

        # data entry user login
        data_entry_user = {"email": "wayan@example.com",
                           "password": "Test123*"}
        data_entry_user = self.client.post('/api/v1/login',
                                           data_entry_user,
                                           content_type='application/json')
        data_entry_user = data_entry_user.json()
        data_entry_user_token = data_entry_user.get('token')
        self.assertTrue(data_entry_user_token)
        # get profile
        header = {'HTTP_AUTHORIZATION': f'Bearer {data_entry_user_token}'}
        response = self.client.get("/api/v1/profile",
                                   content_type='application/json',
                                   **header)
        self.assertEqual(response.status_code, 200)
        response = response.json()
        self.assertEqual(response['email'], 'wayan@example.com')
        self.assertEqual(response['role']['id'], UserRoleTypes.user)
        # Get all data from form
        data = self.client.get('/api/v1/form-data/1?page=1',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION':
                                   f'Bearer {data_entry_user_token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data['data']) > 0, True)
        data_id = data['data'][0]['id']  # get data_id here
        # Get answer from data
        data = self.client.get(f'/api/v1/data/{data_id}',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION':
                                   f'Bearer {data_entry_user_token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data) > 0, True)
        self.assertEqual(data[0]['question'], 101)
        self.assertEqual(data[0]['value'], 'Wayan')
        self.assertEqual(data[0]['history'], False)
        self.assertEqual(data[1]['question'], 102)
        self.assertEqual(data[1]['value'], ['Female'])
        self.assertEqual(data[1]['history'], False)
        # Update data for question 101 and 102
        payload = {
            "data": {
                "name": "Pending Testing Data",
                "administration": 2,
                "geo": [6.2088, 106.8456]
            },
            "answer": [{
                "question": 101,
                "value": "User Wayan"
            }, {
                "question": 102,
                "value": ["Male"]
            }]
        }
        data = self.client.put(f'/api/v1/form-data/1?data_id={data_id}',
                               payload,
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION':
                                   f'Bearer {data_entry_user_token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data, {"message": "store to pending data success"})
        # Get all data from pending data
        data = self.client.get('/api/v1/form-pending-data/1?page=1',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION':
                                   f'Bearer {data_entry_user_token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data['data']) > 0, True)
        self.assertEqual(data['data'][0]['created_by'], "User Wayan")
        self.assertEqual(data['data'][0]['data_id'], data_id)
        pending_data_id = data['data'][0]['id']  # get pending_data_id here
        # Get pending answer by pending_data_id
        data = self.client.get(f'/api/v1/pending-data/{pending_data_id}',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION':
                                   f'Bearer {data_entry_user_token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data) > 0, True)
        results = [{
            'history': False,
            'question': 101,
            'value': 'User Wayan'
        }, {
            'history': False,
            'question': 102,
            'value': ['Male']
        }]
        self.assertEqual(data, results)
        # test get form data with pending data object inside
        data = self.client.get('/api/v1/form-data/1?page=1',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION':
                                   f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data['data']) > 0, True)
        self.assertEqual(data['data'][0]['pending_data'],
                         {'id': pending_data_id, 'created_by': 'User Wayan'})
