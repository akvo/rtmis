from django.test import TestCase

from api.v1.v1_profile.models import Administration, Levels


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


class UserInvitationTestCase(TestCase):

    def test_user_list(self):
        seed_administration_test()
        user_payload = {"email": "admin@rtmis.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login/',
                                         user_payload,
                                         content_type='application/json')
        user = user_response.json()
        token = user.get('token')
        response = self.client.get("/api/v1/list/users/", follow=True,
                                   **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        users = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(users[0]['first_name'], 'Admin')
        self.assertEqual(users[0]['last_name'], 'RTMIS')
        self.assertEqual(users[0]['email'], 'admin@rtmis.com')
        self.assertEqual(users[0]['administration'],
                         {'id': 1, 'name': 'Indonesia', 'level': 1})
        self.assertEqual(users[0]['role'],
                         {'id': 1, 'value': 'Super Admin'})

    def test_add_edit_user(self):
        seed_administration_test()
        user_payload = {"email": "admin@rtmis.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login/',
                                         user_payload,
                                         content_type='application/json')
        user = user_response.json()
        token = user.get('token')
        payload = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@example.com",
            "administration": 2,
            "role": 2
        }
        header = {
            'HTTP_AUTHORIZATION': f'Bearer {token}'
        }
        add_response = self.client.post("/api/v1/add/user/",
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
            "role": 2
        }
        header = {
            'HTTP_AUTHORIZATION': f'Bearer {token}'
        }

        list_response = self.client.get("/api/v1/list/users/", follow=True,
                                        **header)
        users = list_response.json()
        fl = list(filter(lambda x: x['email'] == 'john@example.com', users))

        add_response = self.client.put(
            "/api/v1/edit/user/{0}/".format(fl[0]['id']),
            edit_payload,
            content_type='application/json',
            **header)
        self.assertEqual(add_response.status_code, 200)
        self.assertEqual(add_response.json(),
                         {'message': 'User updated successfully'})
