from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings

from api.v1.v1_data.models import FormData
from api.v1.v1_forms.models import Forms, Questions
from api.v1.v1_profile.models import Administration
from api.v1.v1_forms.constants import QuestionTypes


@override_settings(USE_TZ=False)
class DataVisualisationTestCase(TestCase):
    def test_maps_data(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        token = user_response.json().get('token')

        call_command("form_seeder", "--test")
        call_command("fake_data_seeder", "-r", 2, '-t', True)
        header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        form = Forms.objects.first()
        questions = Questions.objects.filter(form=form)
        shape = questions.filter(type=QuestionTypes.number).first().id
        marker = questions.filter(type=QuestionTypes.option).first().id

        data = self.client.get("/api/v1/maps/{0}".format(form.id),
                               follow=True,
                               **header)
        self.assertEqual(data.status_code, 400)
        data = self.client.get("/api/v1/maps/{0}?shape={1}&marker={2}".format(
            form.id, shape, marker),
                               follow=True,
                               **header)
        self.assertEqual(data.status_code, 200)
        self.assertEqual(list(data.json()[0]),
                         ['id', 'loc', 'name', 'geo', 'marker', 'shape'])
        data = data.json()
        for d in data:
            form_data = FormData.objects.get(id=d.get('id'))
            self.assertEqual(d.get("name"), form_data.name)
            self.assertEqual(len(d.get("geo")), 2)
            self.assertIsNotNone(d.get("marker"))
            self.assertIsNotNone(d.get("loc"))
            self.assertIsNotNone(d.get("shape"))
        # Test Map Overview
        data = self.client.get("/api/v1/maps/county/{0}".format(form.id),
                               follow=True,
                               **header)
        self.assertEqual(data.status_code, 400)
        data = self.client.get("/api/v1/maps/county/{0}?shape={1}".format(
            form.id, shape),
                               follow=True,
                               **header)
        self.assertEqual(data.status_code, 200)
        self.assertEqual(list(data.json()[0]), ['loc', 'shape'])

    def test_chart_data(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        token = user_response.json().get('token')

        call_command("form_seeder", "--test")
        call_command("fake_data_seeder", "-r", 2, '-t', True)
        header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        form = Forms.objects.first()
        question = Questions.objects.filter(form=form,
                                            type=QuestionTypes.option).first()

        data = self.client.get("/api/v1/chart/data/{0}".format(form.id),
                               follow=True,
                               **header)
        self.assertEqual(data.status_code, 400)
        data = self.client.get("/api/v1/chart/data/{0}?question={1}".format(
            form.id, question.id),
                               follow=True,
                               **header)
        self.assertEqual(data.status_code, 200)
        self.assertEqual(list(data.json().get('data')[0]), ['name', 'value'])
        self.assertEqual(data.json().get('type'), 'PIE')
        data = self.client.get(
            "/api/v1/chart/data/{0}?question={1}&stack={1}".format(
                form.id, question.id),
            follow=True,
            **header)
        self.assertEqual(data.status_code, 200)
        self.assertEqual(data.json().get('type'), 'BARSTACK')
        self.assertEqual(list(data.json().get('data')[0]), ['group', 'child'])
        self.assertEqual(list(data.json().get('data')[0]['child'][0]),
                         ['name', 'value'])

        data = self.client.get(
            "/api/v1/chart/administration/{0}?question={1}".format(
                form.id, question.id),
            follow=True,
            **header)
        self.assertEqual(data.status_code, 400)
        administration = Administration.objects.filter(level_id=1).first()
        data = self.client.get(
            "/api/v1/chart/administration/{0}?question={1}&administration={2}".
            format(form.id, question.id, administration.id),
            follow=True,
            **header)
        self.assertEqual(data.status_code, 200)
        self.assertEqual(data.json().get('type'), 'BARSTACK')
        self.assertEqual(list(data.json().get('data')[0]), ['group', 'child'])
        self.assertEqual(list(data.json().get('data')[0]['child'][0]),
                         ['name', 'value'])

        # CHART CRITERIA API
        # INCORRECT PARAMETER
        administration = Administration.objects.filter(level_id=1).first()
        payload = [{
            "name":
            "Test",
            "option": [{
                "question": 102,
                "options": ["Male"],
            }, {
                "question": 106,
                "options": ["Parent"],
            }],
        }]
        data = self.client.post(
            "/api/v1/chart/criteria/{0}?administration={1}".format(
                form.id, administration.id),
            payload,
            content_type='application/json')
        self.assertEqual(data.status_code, 400)

        payload = [{
            "name": "Test",
            "options": [{
                "question": 102,
                "option": ["Male"],
            }, {
                "question": 106,
                "option": ["Parent"],
            }],
        }]

        # CHART CRITERIA API
        # CORRECT PARAMETER
        data = self.client.post(
            "/api/v1/chart/criteria/{0}?administration={1}".format(
                form.id, administration.id),
            payload,
            content_type='application/json')
        self.assertEqual(data.status_code, 200)
        self.assertEqual(data.json().get('type'), 'BARSTACK')
        self.assertEqual(list(data.json().get('data')[0]), ['group', 'child'])
        self.assertEqual(list(data.json().get('data')[0]['child'][0]),
                         ['name', 'value'])

        # CHART OVERVIEW API
        data = self.client.get("/api/v1/chart/overview/{0}".format(form.id),
                               follow=True)
        self.assertEqual(data.status_code, 400)

        data = self.client.get(
            "/api/v1/chart/overview/{0}?question={1}".format(
                form.id, question.id),
            follow=True,
            **header)
        self.assertEqual(data.status_code, 200)
        self.assertEqual(list(data.json().get('data')[0]), ['name', 'value'])
        self.assertEqual(data.json().get('type'), 'BAR')

        data = self.client.get(
            "/api/v1/chart/overview/{0}?question={1}&stack={2}".format(
                form.id, 106, 102),
            follow=True,
            **header)
        self.assertEqual(data.status_code, 200)
        self.assertEqual(data.json().get('type'), 'BARSTACK')
        self.assertEqual(list(data.json().get('data')[0]), ['group', 'child'])
        for d in data.json().get('data'):
            if d.get('child'):
                self.assertEqual(list(d.get('child')[0]), ['name', 'value'])

        # CHART OVERVIEW CRITERIA API
        # INCORRECT PARAMETER
        payload = [{
            "name": "Test",
            "option": [{
                "question": 102,
                "options": ["Male"],
            }, {
                "question": 106,
                "options": ["Parent"],
            }]
        }]
        data = self.client.post("/api/v1/chart/criteria/{0}".format(form.id),
                                payload,
                                content_type='application/json')
        self.assertEqual(data.status_code, 400)

        # CORRECT PARAMETER, RUN WITH CACHE
        url = "/api/v1/chart/criteria/{0}?cache=test-cache".format(form.id)
        payload = [{
            "name": "Test",
            "options": [{
                "question": 102,
                "option": ["Male"],
            }, {
                "question": 106,
                "option": ["Parent"],
            }]
        }]
        data = self.client.post(url.format(form.id),
                                payload,
                                content_type='application/json')
        self.assertEqual(data.status_code, 200)

        data = data.json()
        self.assertEqual(data.get('type'), 'BARSTACK')
        self.assertEqual(list(data.get('data')[0]), ['group', 'child'])
        self.assertEqual(list(data.get('data')[0]['child'][0]),
                         ['name', 'value'])
