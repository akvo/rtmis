import uuid
import re
from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from faker import Faker

from api.v1.v1_forms.models import Forms
from api.v1.v1_forms.constants import FormTypes, SubmissionTypes
from api.v1.v1_profile.models import Access, Levels, Administration
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_users.models import SystemUser
from api.v1.v1_data.models import FormData, PendingFormData, \
    Answers, PendingAnswers

fake = Faker()


def create_user(role_level):
    profile = fake.profile()
    name = profile.get("name")
    email = ("{}@test.com").format(
        re.sub('[^A-Za-z0-9]+', '', name.lower()))
    email = "{}_{}".format(str(uuid.uuid4())[:4], email)
    name = name.split(" ")
    roles = [
        UserRoleTypes.super_admin, UserRoleTypes.admin,
        UserRoleTypes.approver, UserRoleTypes.user
    ]
    user = SystemUser.objects.create(
        email=email,
        first_name=name[0],
        last_name=name[1],
        phone_number=fake.msisdn(),
        designation=profile.get('job')[:49])
    user.set_password('Test105*')
    user.save()
    level = Levels.objects.filter(level=role_level).first()
    Access.objects.create(
        user=user,
        role=roles[role_level],
        administration=Administration.objects.filter(
            level=level).order_by('?').first())
    return user


@override_settings(USE_TZ=False)
class AddNewDataTestCase(TestCase):
    def test_add_new_data_by_super_admin(self):
        call_command("administration_seeder", "--test")
        user = {"email": "admin@rush.com", "password": "Test105*"}
        user = self.client.post('/api/v1/login',
                                user,
                                content_type='application/json')
        user = user.json()
        token = user.get("token")
        self.assertTrue(token)

        call_command("form_seeder", "--test")
        form = Forms.objects.first()
        self.assertEqual(form.id, 1)
        self.assertEqual(form.name, "Test Form")
        self.assertEqual(form.type, FormTypes.county)
        form_id = form.id
        payload = {
            "data": {
                "name": "Testing Data",
                "administration": 2,
                "geo": [6.2088, 106.8456],
                "submission_type": SubmissionTypes.registration,
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
                "value": 2.0
            }, {
                "question": 105,
                "value": [6.2088, 106.8456]
            }, {
                "question": 106,
                "value": ["Parent", "Children"]
            }, {
                "question": 109,
                "value": 0
            }]
        }
        data = self.client.post('/api/v1/form-pending-data/{0}'
                                .format(form_id),
                                payload,
                                content_type='application/json',
                                **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data, {"message": "ok"})
        pending_form_data = PendingFormData.objects.filter(
            form_id=form_id).count()
        self.assertEqual(pending_form_data, 0)
        form_data = FormData.objects.filter(form_id=form_id).first()
        self.assertEqual(form_data.name, "Testing Data")
        answers = Answers.objects.filter(data_id=form_data.id).count()
        self.assertGreater(answers, 0)
        # check administration answer value as integer
        data = self.client.get('/api/v1/data/{0}'
                               .format(form_data.id),
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        for d in data:
            if d.get('question') == 104:
                self.assertEqual(isinstance(d.get('value'), int), True)
            if d.get('question') == 109:
                self.assertEqual(d.get('value'), 0)

    def test_add_new_data_by_county_admin(self):
        call_command("administration_seeder", "--test")
        user = create_user(1)
        user = {"email": user.email, "password": "Test105*"}
        user = self.client.post('/api/v1/login',
                                user,
                                content_type='application/json')
        user = user.json()
        token = user.get("token")
        self.assertTrue(token)

        call_command("form_seeder", "--test")

        # county form
        form = Forms.objects.first()
        self.assertEqual(form.id, 1)
        self.assertEqual(form.name, "Test Form")
        self.assertEqual(form.type, FormTypes.county)
        form_id = form.id
        payload = {
            "data": {
                "name": "Testing Data County",
                "administration": 2,
                "geo": [6.2088, 106.8456],
                "submission_type": SubmissionTypes.registration,
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
            }, {
                "question": 109,
                "value": 2.5
            }]
        }
        data = self.client.post('/api/v1/form-pending-data/{0}'
                                .format(form_id),
                                payload,
                                content_type='application/json',
                                **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data, {"message": "ok"})
        pending_form_data = PendingFormData.objects.filter(
            form_id=form_id).count()
        self.assertEqual(pending_form_data, 0)
        form_data = FormData.objects.filter(form_id=form_id).first()
        self.assertEqual(form_data.name, "Testing Data County")
        answers = Answers.objects.filter(data_id=form_data.id).count()
        self.assertGreater(answers, 0)
        # check administration answer value as integer
        data = self.client.get('/api/v1/data/{0}'
                               .format(form_data.id),
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        for d in data:
            if d.get('question') == 104:
                self.assertEqual(isinstance(d.get('value'), int), True)
            if d.get('question') == 109:
                self.assertEqual(isinstance(d.get('value'), float), True)
                self.assertEqual(d.get('value'), 2.5)

        # national form
        form = Forms.objects.filter(
            type=FormTypes.national).first()
        self.assertEqual(form.id, 2)
        self.assertEqual(form.name, "Test Form 2")
        self.assertEqual(form.type, FormTypes.national)
        form_id = form.id
        payload = {
            "data": {
                "name": "Testing Data National",
                "administration": 2,
                "geo": [6.2088, 106.8456],
                "submission_type": SubmissionTypes.registration,
            },
            "answer": [{
                "question": 201,
                "value": "Jane"
            }, {
                "question": 202,
                "value": ["Male"]
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
        data = self.client.post('/api/v1/form-pending-data/{0}'
                                .format(form_id),
                                payload,
                                content_type='application/json',
                                **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data, {"message": "ok"})
        pending_form_data = PendingFormData.objects.filter(
                form_id=form_id).first()
        self.assertEqual(pending_form_data.name, "Testing Data National")
        answers = PendingAnswers.objects.filter(
                pending_data_id=pending_form_data.id).count()
        self.assertGreater(answers, 0)
        form_data = FormData.objects.filter(
            form_id=form_id).count()
        self.assertEqual(form_data, 0)

    def test_add_new_data_by_data_entry(self):
        call_command("administration_seeder", "--test")
        user = create_user(3)
        user = {"email": user.email, "password": "Test105*"}
        user = self.client.post('/api/v1/login',
                                user,
                                content_type='application/json')
        user = user.json()
        token = user.get("token")
        self.assertTrue(token)

        call_command("form_seeder", "--test")
        form = Forms.objects.first()
        self.assertEqual(form.id, 1)
        self.assertEqual(form.name, "Test Form")
        self.assertEqual(form.type, FormTypes.county)
        form_id = form.id
        payload = {
            "data": {
                "name": "Testing Data Entry",
                "administration": 2,
                "geo": [6.2088, 106.8456],
                "submission_type": SubmissionTypes.registration,
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
        data = self.client.post('/api/v1/form-pending-data/{0}'
                                .format(form_id),
                                payload,
                                content_type='application/json',
                                **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data, {"message": "ok"})
        form_data = FormData.objects.filter(form_id=form_id).count()
        self.assertEqual(form_data, 0)
        pending_form_data = PendingFormData.objects.filter(
            form_id=form_id).first()
        self.assertEqual(pending_form_data.name, "Testing Data Entry")
        pending_answers = PendingAnswers.objects.filter(
            pending_data_id=pending_form_data.id).count()
        self.assertGreater(pending_answers, 0)

    def test_add_new_data_by_data_entry_with_some_empty_values(self):
        call_command("administration_seeder", "--test")
        user = create_user(3)
        user = {"email": user.email, "password": "Test105*"}
        user = self.client.post('/api/v1/login',
                                user,
                                content_type='application/json')
        user = user.json()
        token = user.get("token")
        self.assertTrue(token)

        call_command("form_seeder", "--test")
        form = Forms.objects.first()
        self.assertEqual(form.id, 1)
        self.assertEqual(form.name, "Test Form")
        self.assertEqual(form.type, FormTypes.county)
        form_id = form.id
        payload = {
            "data": {
                "name": "Testing Data Entry",
                "administration": 2,
                "geo": [6.2088, 106.8456],
                "submission_type": SubmissionTypes.registration,
            },
            "answer": [{
                "question": 101,
                "value": ""
            }, {
                "question": 102,
                "value": []
            }, {
                "question": 103,
                "value": None
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
        data = self.client.post('/api/v1/form-pending-data/{0}'
                                .format(form_id),
                                payload,
                                content_type='application/json',
                                **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 400)
        data = data.json()
        self.assertIn("101", data["message"])
        self.assertIn("102", data["message"])
        self.assertIn("value may not be null.", data["message"])
