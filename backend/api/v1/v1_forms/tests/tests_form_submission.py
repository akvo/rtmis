from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings

from api.v1.v1_forms.models import Forms
from api.v1.v1_profile.models import Administration, Levels
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
class FormSubmissionTestCase(TestCase):
    def test_webform_endpoint(self):
        self.maxDiff = None
        seed_administration_test()
        call_command("form_seeder", "--test")
        user = {"email": "admin@rush.com", "password": "Test105*"}
        user = self.client.post('/api/v1/login',
                                user,
                                content_type='application/json')
        user = user.json()
        token = user.get("token")
        self.assertTrue(token)
        webform = self.client.get("/api/v1/form/web/1",
                                  follow=True,
                                  content_type='application/json',
                                  **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        webform = webform.json()
        self.assertEqual(webform.get("name"), "Test Form")
        question_group = webform.get("question_group")
        self.assertEqual(len(question_group), 1)
        self.assertEqual(question_group[0].get("name"), "Question Group 01")

    def test_create_new_submission(self):
        self.maxDiff = None
        seed_administration_test()
        user = {"email": "admin@rush.com", "password": "Test105*"}
        user = self.client.post('/api/v1/login',
                                user,
                                content_type='application/json')
        user = user.json()
        call_command("form_seeder", "--test")
        form = Forms.objects.first()
        self.assertEqual(form.name, "Test Form")
        payload = {
            "data": {
                "name": "Testing Data",
                "administration": 2,
                "geo": [6.2088, 106.8456]
            },
            "answer": [{
                "question": 101,
                "value": "John"
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
        payload = {"data": {}, "answer": [{"question": 101, "value": ""}]}
        data = self.client.post('/api/v1/form-data/1/',
                                payload,
                                content_type='application/json',
                                **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 400)
        data = data.json()
        self.assertEqual(
            data.get('message'),
            "name is required.|administration is required."
            "|Value is required for Question:101")

    def test_form_data_endpoint(self):
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")
        webform = self.client.get("/api/v1/form/1", follow=True)
        webform = webform.json()
        self.assertEqual(webform.get("name"), "Test Form")
        question_group = webform.get("question_group")
        self.assertEqual(len(question_group), 1)
        self.assertEqual(question_group[0].get("name"), "Question Group 01")

    def test_edit_form_type(self):
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        user = user_response.json()
        token = user.get('token')
        header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        form = Forms.objects.first()
        payload = [{"form_id": form.id, "type": 3}]
        response = self.client.post('/api/v1/form/type',
                                    payload,
                                    content_type='application/json',
                                    **header)
        self.assertEqual(400, response.status_code)

        payload = [{"form_id": form.id, "type": 1}]

        response = self.client.post('/api/v1/form/type',
                                    payload,
                                    content_type='application/json',
                                    **header)
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json().get('message'),
                         'Forms updated successfully')

    def test_edit_form_approval(self):
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        user = user_response.json()
        token = user.get('token')
        header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        form = Forms.objects.first()
        payload = [{"form_id": form.id, "level_id": 3}]
        response = self.client.put('/api/v1/form/approval',
                                   payload,
                                   content_type='application/json',
                                   **header)

        self.assertEqual(400, response.status_code)
        level = Levels.objects.first()
        payload = [{"form_id": form.id, "level_id": [level.id]}]

        response = self.client.put('/api/v1/form/approval',
                                   payload,
                                   content_type='application/json',
                                   **header)
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json().get('message'),
                         'Forms updated successfully')

    def test_approval_form_user(self):
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        user = user_response.json()
        token = user.get('token')
        header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        u = SystemUser.objects.first()
        payload = [{"user_id": u.id, "administration_id": 0}]
        response = self.client.post('/api/v1/form/approver/1',
                                    payload,
                                    content_type='application/json',
                                    **header)

        self.assertEqual(400, response.status_code)
        # add/update
        payload = [{
            "user_id": u.id,
            "administration_id": 1,
            "flag": "add"
        }]
        response = self.client.post('/api/v1/form/approver/1',
                                    payload,
                                    content_type='application/json',
                                    **header)
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json().get('message'),
                         'Forms updated successfully')
        # delete
        payload = [{
            "user_id": u.id,
            "administration_id": 1,
            "flag": "delete"
        }]
        response = self.client.post('/api/v1/form/approver/1',
                                    payload,
                                    content_type='application/json',
                                    **header)
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json().get('message'),
                         'Forms updated successfully')
