from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from django.test.utils import override_settings

from api.v1.v1_forms.models import Forms
from api.v1.v1_profile.models import Administration, \
    Levels, Access
from api.v1.v1_users.models import Organisation, SystemUser


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

    def test_edit_form_approval(self):
        call_command("fake_organisation_seeder", "--repeat", 3)
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        user = user_response.json()
        token = user.get('token')
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        org = Organisation.objects.order_by('?').first()
        form = Forms.objects.filter(type=1).first()
        user = user_response.json()
        token = user.get('token')
        email = "test_approver@example.com"
        admin = Administration.objects.filter(
            level=Levels.objects.filter(level=3).first()
        ).order_by('?').first()
        payload = {
            "first_name": "Test",
            "last_name": "Approver",
            "email": email,
            "administration": admin.id,
            "organisation": org.id,
            "role": 3,
            "forms": [form.id],
            "trained": True,
        }
        header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        add_response = self.client.post("/api/v1/user",
                                        payload,
                                        content_type='application/json',
                                        **header)
        user = SystemUser.objects.filter(email=email).first()
        user.set_password("Test105*")
        user.updated = timezone.now()
        access = Access.objects.filter(user=user).first()
        self.assertEqual(access.administration, admin)
        self.assertEqual(add_response.status_code, 200)
        approval_response = self.client.get(
            "/api/v1/form/approver/?administration_id={}&form_id={}".format(
                admin.parent.id, form.id
            ),
            content_type='application/json',
            **header)
        self.assertEqual(approval_response.status_code, 200)
        self.assertEqual(approval_response.json(), [{
            'administration': {
                'id': admin.id,
                'name': admin.name,
            },
            'user': {
                'id': user.id,
                'email': email,
                'first_name': 'Test',
                'last_name': 'Approver',
            }
        }])
