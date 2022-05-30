from django.test import TestCase
from django.core.management import call_command

from api.v1.v1_data.tests.tests_add_new_data import create_user
from api.v1.v1_data.models import Forms, FormData, PendingFormData, \
    PendingAnswers, PendingAnswerHistory
from api.v1.v1_forms.constants import FormTypes


class UpdatePendingDataTestCase(TestCase):
    def test_update_pending_data(self):
        call_command("administration_seeder", "--test")
        user = create_user(3)
        user_id = user.id
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

        # Add pending data
        payload = {
            "data": {
                "name": "Testing Data Entry",
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
        pending_data_id = pending_form_data.id
        pending_answers = PendingAnswers.objects.filter(
            pending_data_id=pending_form_data.id).count()
        self.assertGreater(pending_answers, 0)

        # get list of pending data
        data = self.client.get(
            '/api/v1/form-pending-data/{0}'.format(form_id),
            **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data['data'][0]['name'], "Testing Data Entry")
        self.assertEqual(data['data'][0]['pending_answer_history'], False)

        # get pending data detail / answers
        data = self.client.get(
            '/api/v1/pending-data/{0}'.format(pending_data_id),
            **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        for d in data:
            self.assertEqual(d['history'], False)

        # update pending data
        payload = [{
            "question": 101,
            "value": "Jane Doe"
        }, {
            "question": 102,
            "value": ["Female"]
        }]
        data = self.client.put(
            '/api/v1/form-pending-data/{0}?pending_data_id={1}'
            .format(form_id, pending_data_id),
            payload,
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data, {"message": "update success"})
        pending_form_data = PendingFormData.objects.filter(
            pk=pending_data_id).first()
        self.assertTrue(pending_form_data.updated is not None)
        self.assertEqual(pending_form_data.updated_by.id, user_id)
        pending_answer_history = PendingAnswerHistory.objects.filter(
            pending_data=pending_data_id).count()
        self.assertGreater(pending_answer_history, 0)

        # get list of pending data
        data = self.client.get(
            '/api/v1/form-pending-data/{0}'.format(form_id),
            **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data['data'][0]['name'], "Testing Data Entry")
        self.assertEqual(data['data'][0]['pending_answer_history'], True)

        # get pending data detail / answers
        data = self.client.get(
            '/api/v1/pending-data/{0}'.format(pending_data_id),
            **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        for d in data:
            if d['question'] == 101:
                self.assertEqual(d['value'], "Jane Doe")
                self.assertEqual(d['history'][0]['value'], "Jane")
            if d['question'] == 102:
                self.assertEqual(d['value'], ["Female"])
                self.assertEqual(d['history'][0]['value'], ["Male"])
            if d['question'] not in [101, 102]:
                self.assertEqual(d['history'], False)
