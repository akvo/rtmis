from django.core.management import call_command
from django.test import TestCase

from api.v1.v1_forms.models import Forms
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


class FormSubmissionTestCase(TestCase):
    def test_webform_endpoint(self):

        self.maxDiff = None
        call_command("form_seeder", "--test")
        seed_administration_test()
        webform = self.client.get("/api/v1/web/form/1", follow=True)
        webform = webform.json()
        self.assertEqual(webform.get("name"), "Test Form")
        question_group = webform.get("question_group")
        self.assertEqual(len(question_group), 1)
        self.assertEqual(question_group[0].get("name"), "Question Group 01")
        question = question_group[0].get("question")
        self.assertEqual(question[3]["type"], "cascade")
        self.assertEqual(question[3]["option"], "administration")
        self.assertEqual(
            webform.get("cascade"), {
                "administration":
                [{
                    "label": "Indonesia",
                    "value": 1,
                    "children": [{
                        "label": "Jakarta",
                        "value": 2,
                        "children": []
                    }]
                }]
            })

    def test_create_new_submission(self):

        self.maxDiff = None
        seed_administration_test()
        user = {"email": "admin@rtmis.com", "password": "Test105*"}
        user = self.client.post('/api/v1/login/',
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
                "question": 1,
                "value": "John"
            }, {
                "question": 2,
                "value": ["Male"]
            }, {
                "question": 3,
                "value": 31208200175
            }, {
                "question": 4,
                "value": 2
            }, {
                "question": 5,
                "value": [6.2088, 106.8456]
            }, {
                "question": 6,
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
        payload = {"data": {}, "answer": payload["answer"]}
        data = self.client.post('/api/v1/form-data/1/',
                                payload,
                                content_type='application/json',
                                **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 400)
        data = data.json()
        self.assertEqual(
            data,
            {"message": "name is required.|administration is required."})
