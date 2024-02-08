from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings

from api.v1.v1_forms.models import Forms
from api.v1.v1_users.models import Organisation


@override_settings(USE_TZ=False)
class FormSubmissionTestCase(TestCase):
    def setUp(self):
        call_command("administration_seeder", "--test")
        call_command("fake_organisation_seeder", "--repeat", 3)
        call_command("form_seeder", "--test")
        user = {"email": "admin@rush.com", "password": "Test105*"}
        user = self.client.post('/api/v1/login',
                                user,
                                content_type='application/json')
        user = user.json()
        token = user.get("token")
        self.header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        self.org = Organisation.objects.order_by('?').first()

    def test_webform_endpoint(self):
        webform = self.client.get("/api/v1/form/web/1",
                                  follow=True,
                                  content_type='application/json',
                                  **self.header)
        webform = webform.json()
        self.assertEqual(webform.get("name"), "Test Form")
        question_group = webform.get("question_group")
        self.assertEqual(len(question_group), 1)
        self.assertEqual(question_group[0].get("name"), "Question Group 01")

    def test_create_new_submission(self):
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
        data = self.client.post('/api/v1/form-data/1/',
                                payload,
                                content_type='application/json',
                                **self.header)
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data, {"message": "ok"})
        payload = {"data": {}, "answer": [{"question": 101, "value": ""}]}
        data = self.client.post('/api/v1/form-data/1/',
                                payload,
                                content_type='application/json',
                                **self.header)
        self.assertEqual(data.status_code, 400)
        data = data.json()
        self.assertEqual(
            data.get('message'),
            "name is required.|administration is required."
            "|Value is required for Question:101")

    def test_form_data_endpoint(self):
        webform = self.client.get("/api/v1/form/1", follow=True)
        webform = webform.json()
        self.assertEqual(webform.get("name"), "Test Form")
        question_group = webform.get("question_group")
        self.assertEqual(len(question_group), 1)
        self.assertEqual(question_group[0].get("name"), "Question Group 01")
