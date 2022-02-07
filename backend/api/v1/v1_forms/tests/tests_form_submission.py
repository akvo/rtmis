from io import StringIO
from django.core.management import call_command
from django.test import TestCase
from api.v1.v1_forms.models import Forms
from api.v1.v1_profile.models import Administration, Levels


class FormSubmissionTestCase(TestCase):
    def call_command(self, *args, **kwargs):
        out = StringIO()
        call_command(
            "form_seeder",
            "--test",
            stdout=out,
            stderr=StringIO(),
            **kwargs,
        )
        return out.getvalue()

    def test_create_new_submission(self):

        self.maxDiff = None
        level = Levels(name="country", level=1)
        level.save()
        administration = Administration(name="Indonesia",
                                        parent=None,
                                        level=level)
        administration.save()
        administration = Administration(name="Jakarta",
                                        parent=administration,
                                        level=level)
        administration.save()
        user = {"email": "admin@rtmis.com", "password": "Test105*"}
        user = self.client.post('/api/v1/login/',
                                user,
                                content_type='application/json')
        user = user.json()
        self.call_command()
        form = Forms.objects.first()
        self.assertEqual(form.name, "Test Form")
        self.assertEqual(["email", "name", "token", "invite"], list(user))
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
            {"message": "This field is required.|administration is required."})
