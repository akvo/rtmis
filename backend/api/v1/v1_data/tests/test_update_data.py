from django.core.management import call_command
from django.test import TestCase
from django.core import signing
from django.test.utils import override_settings

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


@override_settings(USE_TZ=False)
class FormDataUpdateTestCase(TestCase):
    def test_update_datapoint_by_admin_role(self):
        self.maxDiff = None
        seed_administration_test()
        user = {"email": "admin@rush.com", "password": "Test105*"}
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
        data = self.client.get('/api/v1/form-data/1?submission_type=1&page=1',
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
        for d in data:
            question = d.get('question')
            value = d.get('value')
            history = d.get('history')
            if question == 101:
                self.assertEqual(question, 101)
                self.assertEqual(value, 'Jane')
                self.assertEqual(history, None)
            if question == 102:
                self.assertEqual(question, 102)
                self.assertEqual(value, ['Male'])
                self.assertEqual(history, None)
        # Update data for question 101 and 102
        payload = [{
            "question": 101,
            "value": "Jane Doe"
        }, {
            "question": 102,
            "value": ["Female"]
        }]
        data = self.client.put(f'/api/v1/form-data/1?data_id={data_id}',
                               payload,
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data, {"message": "direct update success"})
        # Get all data from form
        data = self.client.get('/api/v1/form-data/1?submission_type=1&page=1',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data['data']) > 0, True)
        self.assertEqual(data['data'][0]['name'], 'Testing Data')
        # Get answer from data with history
        data = self.client.get(f'/api/v1/data/{data_id}',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data) > 0, True)
        for d in data:
            question = d.get('question')
            value = d.get('value')
            history = d.get('history')
            if question == 101:
                self.assertEqual(question, 101)
                self.assertEqual(value, 'Jane Doe')
                self.assertEqual(list(history[0]), [
                    'value', 'created', 'created_by'])
                self.assertEqual(history[0]['value'], 'Jane')
                self.assertEqual(history[0]['created_by'], 'Admin RUSH')
            if question == 102:
                self.assertEqual(question, 102)
                self.assertEqual(value, ['Female'])
                self.assertEqual(list(history[0]), [
                    'value', 'created', 'created_by'])
                self.assertEqual(history[0]['value'], ['Male'])
                self.assertEqual(history[0]['created_by'], 'Admin RUSH')

    def test_update_datapoint_by_data_entry_role(self):
        self.maxDiff = None
        seed_administration_test()
        call_command("form_seeder", "--test")

        form = Forms.objects.first()
        self.assertEqual(form.id, 1)
        self.assertEqual(form.name, "Test Form")
        self.assertEqual(form.type, FormTypes.county)

        user = {"email": "admin@rush.com", "password": "Test105*"}
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
        data = self.client.get('/api/v1/form-data/1?submission_type=1&page=1',
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
        for d in data:
            question = d.get('question')
            value = d.get('value')
            history = d.get('history')
            if question == 101:
                self.assertEqual(question, 101)
                self.assertEqual(value, 'Wayan')
                self.assertEqual(history, None)
            if question == 102:
                self.assertEqual(question, 102)
                self.assertEqual(value, ['Female'])
                self.assertEqual(history, None)
        # Update data for question 101 and 102
        payload = [{
            "question": 101,
            "value": "User Wayan"
        }, {
            "question": 102,
            "value": ["Male"]
        }]
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
        self.assertEqual(data['data'][0]['name'], 'Testing Data')
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
            'history': None,
            'question': 101,
            'value': 'User Wayan',
            'last_value': None,
        }, {
            'history': None,
            'question': 102,
            'value': ['Male'],
            'last_value': None,
        }]
        self.assertEqual(data, results)
        # test get form data with pending data object inside
        data = self.client.get('/api/v1/form-data/1?submission_type=1&page=1',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION':
                                   f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data['data']) > 0, True)
        self.assertEqual(data['data'][0]['pending_data'],
                         {'id': pending_data_id, 'created_by': 'User Wayan'})

    def test_update_datapoint_by_county_admin_with_national_form(self):
        self.maxDiff = None
        seed_administration_test()
        call_command("form_seeder", "--test")

        form = Forms.objects.filter(id=2).first()
        self.assertEqual(form.id, 2)
        self.assertEqual(form.name, "Test Form 2")
        self.assertEqual(form.type, FormTypes.national)

        user = {"email": "admin@rush.com", "password": "Test105*"}
        user = self.client.post('/api/v1/login',
                                user,
                                content_type='application/json')
        user = user.json()
        token = user.get('token')
        self.assertTrue(token)
        # Add data to edit
        payload = {
            "data": {
                "name": "Testing Data National From Type",
                "administration": 2,
                "geo": [6.2088, 106.8456]
            },
            "answer": [{
                "question": 201,
                "value": "Made"
            }, {
                "question": 202,
                "value": ["Other"]
            }, {
                "question": 203,
                "value": 31208200175
            }, {
                "question": 204,
                "value": 2
            }, {
                "question": 205,
                "value": [6.2088, 106.8456]
            }, {
                "question": 206,
                "value": ["Parent", "Children"]
            }]
        }
        data = self.client.post('/api/v1/form-data/2/',
                                payload,
                                content_type='application/json',
                                **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data, {"message": "ok"})
        # create non admin user/data entry user
        payload = {
            "first_name": "County",
            "last_name": "Admin",
            "email": "county_admin@example.com",
            "administration": 2,
            "forms": [2],
            "role": UserRoleTypes.admin
        }
        header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        res = self.client.post("/api/v1/user",
                               payload,
                               content_type='application/json',
                               **header)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {'message': 'User added successfully'})
        county_admin = SystemUser.objects.filter(
            email="county_admin@example.com").first()
        # check invitation
        invite_payload = signing.dumps(county_admin.pk)
        invite_response = self.client.get(
            '/api/v1/invitation/{0}'.format(invite_payload),
            content_type='application/json')
        self.assertEqual(invite_response.status_code, 200)
        self.assertEqual(invite_response.json(), {'name': "County Admin"})
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

        # county admin login
        county_admin = {"email": "county_admin@example.com",
                        "password": "Test123*"}
        county_admin = self.client.post('/api/v1/login',
                                        county_admin,
                                        content_type='application/json')
        county_admin = county_admin.json()
        county_admin_token = county_admin.get('token')
        self.assertTrue(county_admin_token)
        # get profile
        header = {'HTTP_AUTHORIZATION': f'Bearer {county_admin_token}'}
        response = self.client.get("/api/v1/profile",
                                   content_type='application/json',
                                   **header)
        self.assertEqual(response.status_code, 200)
        response = response.json()
        self.assertEqual(response['email'], 'county_admin@example.com')
        self.assertEqual(response['role']['id'], UserRoleTypes.admin)
        # Get all data from form
        data = self.client.get('/api/v1/form-data/2?submission_type=1&page=1',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION':
                                   f'Bearer {county_admin_token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data['data']) > 0, True)
        data_id = data['data'][0]['id']  # get data_id here
        # Get answer from data
        data = self.client.get(f'/api/v1/data/{data_id}',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION':
                                   f'Bearer {county_admin_token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data) > 0, True)
        for d in data:
            question = d.get('question')
            value = d.get('value')
            history = d.get('history')
            if question == 101:
                self.assertEqual(question, 201)
                self.assertEqual(value, 'Made')
                self.assertEqual(history, None)
            if question == 102:
                self.assertEqual(question, 202)
                self.assertEqual(value, ['Other'])
                self.assertEqual(history, None)
        # Update data for question 101 and 102
        payload = [{
            "question": 201,
            "value": "Made County Admin"
        }, {
            "question": 202,
            "value": ["Male"]
        }]
        data = self.client.put(f'/api/v1/form-data/2?data_id={data_id}',
                               payload,
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION':
                                   f'Bearer {county_admin_token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data, {"message": "store to pending data success"})
        # Get all data from pending data
        data = self.client.get('/api/v1/form-pending-data/2?page=1',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION':
                                   f'Bearer {county_admin_token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data['data']) > 0, True)
        self.assertEqual(data['data'][0]['name'],
                         "Testing Data National From Type")
        self.assertEqual(data['data'][0]['created_by'], "County Admin")
        self.assertEqual(data['data'][0]['data_id'], data_id)
        pending_data_id = data['data'][0]['id']  # get pending_data_id here
        # Get pending answer by pending_data_id
        data = self.client.get(f'/api/v1/pending-data/{pending_data_id}',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION':
                                   f'Bearer {county_admin_token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data) > 0, True)
        results = [{
            'history': None,
            'question': 201,
            'value': 'Made County Admin',
            'last_value': None,
        }, {
            'history': None,
            'question': 202,
            'value': ['Male'],
            'last_value': None,
        }]
        self.assertEqual(data, results)
        # test get form data with pending data object inside
        data = self.client.get('/api/v1/form-data/2?submission_type=1&page=1',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION':
                                   f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data['data']) > 0, True)
        self.assertEqual(data['data'][0]['pending_data'],
                         {'id': pending_data_id,
                          'created_by': 'County Admin'})

    def test_update_datapoint_by_county_admin_with_county_form(self):
        self.maxDiff = None
        seed_administration_test()
        call_command("form_seeder", "--test")

        form = Forms.objects.first()
        self.assertEqual(form.id, 1)
        self.assertEqual(form.name, "Test Form")
        self.assertEqual(form.type, FormTypes.county)

        user = {"email": "admin@rush.com", "password": "Test105*"}
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
                "value": "Jane"
            }, {
                "question": 102,
                "value": ["Other"]
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
            "first_name": "County",
            "last_name": "Admin",
            "email": "county_admin@example.com",
            "administration": 2,
            "forms": [1],
            "role": UserRoleTypes.admin
        }
        header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        res = self.client.post("/api/v1/user",
                               payload,
                               content_type='application/json',
                               **header)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {'message': 'User added successfully'})
        county_admin = SystemUser.objects.filter(
            email="county_admin@example.com").first()
        # check invitation
        invite_payload = signing.dumps(county_admin.pk)
        invite_response = self.client.get(
            '/api/v1/invitation/{0}'.format(invite_payload),
            content_type='application/json')
        self.assertEqual(invite_response.status_code, 200)
        self.assertEqual(invite_response.json(), {'name': "County Admin"})
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

        # county admin login
        county_admin = {"email": "county_admin@example.com",
                        "password": "Test123*"}
        county_admin = self.client.post('/api/v1/login',
                                        county_admin,
                                        content_type='application/json')
        county_admin = county_admin.json()
        county_admin_token = county_admin.get('token')
        self.assertTrue(county_admin_token)
        # get profile
        header = {'HTTP_AUTHORIZATION': f'Bearer {county_admin_token}'}
        response = self.client.get("/api/v1/profile",
                                   content_type='application/json',
                                   **header)
        self.assertEqual(response.status_code, 200)
        response = response.json()
        self.assertEqual(response['email'], 'county_admin@example.com')
        self.assertEqual(response['role']['id'], UserRoleTypes.admin)
        # Get all data from form
        data = self.client.get('/api/v1/form-data/1?submission_type=1&page=1',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION':
                                   f'Bearer {county_admin_token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data['data']) > 0, True)
        data_id = data['data'][0]['id']  # get data_id here
        # Get answer from data
        data = self.client.get(f'/api/v1/data/{data_id}',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION':
                                   f'Bearer {county_admin_token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data) > 0, True)
        for d in data:
            question = d.get('question')
            value = d.get('value')
            history = d.get('history')
            if question == 101:
                self.assertEqual(question, 101)
                self.assertEqual(value, 'Jane')
                self.assertEqual(history, None)
            if question == 102:
                self.assertEqual(question, 102)
                self.assertEqual(value, ['Other'])
                self.assertEqual(history, None)
        # Update data for question 101 and 102
        payload = [{
            "question": 101,
            "value": "Jane Doe"
        }, {
            "question": 102,
            "value": ["Female"]
        }]
        data = self.client.put(f'/api/v1/form-data/1?data_id={data_id}',
                               payload,
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION':
                                   f'Bearer {county_admin_token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data, {"message": "direct update success"})
        # Get all data from form
        data = self.client.get('/api/v1/form-data/1?submission_type=1&page=1',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data['data']) > 0, True)
        self.assertEqual(data['data'][0]['name'], 'Testing Data')
        # Get answer from data with history
        data = self.client.get(f'/api/v1/data/{data_id}',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data) > 0, True)
        for d in data:
            question = d.get('question')
            value = d.get('value')
            history = d.get('history')
            if question == 101:
                self.assertEqual(question, 101)
                self.assertEqual(value, 'Jane Doe')
                self.assertEqual(list(history[0]), [
                    'value', 'created', 'created_by'])
                self.assertEqual(history[0]['value'], 'Jane')
                self.assertEqual(history[0]['created_by'], 'County Admin')
            if question == 102:
                self.assertEqual(question, 102)
                self.assertEqual(value, ['Female'])
                self.assertEqual(list(history[0]), [
                    'value', 'created', 'created_by'])
                self.assertEqual(history[0]['value'], ['Other'])
                self.assertEqual(history[0]['created_by'], 'County Admin')
