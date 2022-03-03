from django.core import signing
from django.core.management import call_command
from django.test import TestCase

from api.v1.v1_users.models import SystemUser


class UserInvitationTestCase(TestCase):

    def test_user_list(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rtmis.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        user = user_response.json()
        token = user.get('token')
        response = self.client.get(
            "/api/v1/users?administration=1&role=1", follow=True,
            **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        users = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(users['data'][0]['first_name'], 'Admin')
        self.assertEqual(users['data'][0]['last_name'], 'RTMIS')
        self.assertEqual(users['data'][0]['email'], 'admin@rtmis.com')
        self.assertEqual(users['data'][0]['administration'],
                         {'id': 1, 'name': 'Indonesia', 'level': 1})
        self.assertEqual(users['data'][0]['role'],
                         {'id': 1, 'value': 'Super Admin'})
        call_command("fake_user_seeder", "-r", 33)
        response = self.client.get(
            "/api/v1/users?page=3", follow=True,
            **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        users = response.json()
        self.assertEqual(len(users['data']), 10)
        self.assertEqual(
            ['id', 'first_name', 'last_name', 'email', 'administration',
             'role', 'phone_number', 'designation', 'invite'],
            list(users['data'][0]))
        response = self.client.get(
            "/api/v1/users?administration=1&descendants=false",
            follow=True,
            **{'HTTP_AUTHORIZATION': f'Bearer {token}'})

        self.assertEqual(response.status_code, 200)

    def test_add_edit_user(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rtmis.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        user = user_response.json()
        token = user.get('token')
        payload = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@example.com",
            "administration": 2,
        }
        header = {
            'HTTP_AUTHORIZATION': f'Bearer {token}'
        }
        add_response = self.client.post("/api/v1/user",
                                        payload,
                                        content_type='application/json',
                                        **header)
        self.assertEqual(add_response.status_code, 400)
        payload["role"] = 2
        add_response = self.client.post("/api/v1/user",
                                        payload,
                                        content_type='application/json',
                                        **header)

        self.assertEqual(add_response.status_code, 200)
        self.assertEqual(add_response.json(),
                         {'message': 'User added successfully'})

        edit_payload = {
            "first_name": "Joe",
            "last_name": "Doe",
            "email": "john@example.com",
            "administration": 2,
            "role": 6
        }
        header = {
            'HTTP_AUTHORIZATION': f'Bearer {token}'
        }

        list_response = self.client.get("/api/v1/users", follow=True,
                                        **header)
        users = list_response.json()
        fl = list(
            filter(lambda x: x['email'] == 'john@example.com', users['data']))

        add_response = self.client.put(
            "/api/v1/user/{0}".format(fl[0]['id']),
            edit_payload,
            content_type='application/json',
            **header)
        self.assertEqual(add_response.status_code, 400)
        edit_payload["role"] = 2
        add_response = self.client.put(
            "/api/v1/user/{0}".format(fl[0]['id']),
            edit_payload,
            content_type='application/json',
            **header)
        self.assertEqual(add_response.status_code, 200)
        self.assertEqual(add_response.json(),
                         {'message': 'User updated successfully'})

    def test_get_user_profile(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rtmis.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        user = user_response.json()
        token = user.get('token')
        header = {
            'HTTP_AUTHORIZATION': f'Bearer {token}'
        }
        response = self.client.get("/api/v1/profile",
                                   content_type='application/json',
                                   **header)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            ['email', 'name', 'administration', 'role', 'phone_number',
             'designation'], list(response.json().keys()))

    def test_get_user_roles(self):
        response = self.client.get("/api/v1/user/roles",
                                   content_type='application/json', )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(4, len(response.json()))
        self.assertEqual(['id', 'value'], list(response.json()[0].keys()))

    #
    def test_verify_invite(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rtmis.com", "password": "Test105*"}
        self.client.post('/api/v1/login',
                         user_payload,
                         content_type='application/json')
        user = SystemUser.objects.first()
        invite_payload = 'dummy-token'
        invite_response = self.client.get(
            '/api/v1/invitation/{0}'.format(invite_payload),
            content_type='application/json')
        self.assertEqual(invite_response.status_code, 400)

        invite_payload = signing.dumps(user.pk)
        invite_response = self.client.get(
            '/api/v1/invitation/{0}'.format(invite_payload),
            content_type='application/json')
        self.assertEqual(invite_response.status_code, 200)

    def test_set_user_password(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rtmis.com", "password": "Test105*"}
        self.client.post('/api/v1/login',
                         user_payload,
                         content_type='application/json')
        user = SystemUser.objects.first()
        password_payload = {'invite': 'dummy-token', 'password': 'Test105*',
                            'confirm_password': 'Test105*'}
        invite_response = self.client.put('/api/v1/user/set-password',
                                          password_payload,
                                          content_type='application/json')
        self.assertEqual(invite_response.status_code, 400)
        password_payload = {'invite': signing.dumps(user.pk),
                            'password': 'Test105*',
                            'confirm_password': 'Test105*'}
        invite_response = self.client.put('/api/v1/user/set-password',
                                          password_payload,
                                          content_type='application/json')
        self.assertEqual(invite_response.status_code, 200)

    def test_list_administration(self):
        call_command("administration_seeder", "--test")
        administration = self.client.get('/api/v1/administration/1',
                                         content_type='application/json')
        self.assertEqual(administration.status_code, 200)

        response = self.client.get('/api/v1/levels',
                                   content_type='application/json')
        levels = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(list(levels[0]), ['id', 'name', 'level'])

    def test_config_js(self):
        response = self.client.get('/api/v1/config.js',
                                   content_type='application/json')
        self.assertEqual(response.status_code, 200)
