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


class FormDataUpdateTestCase(TestCase):
    def test_update_datapoint_by_admin_role(self):
        self.maxDiff = None
        seed_administration_test()
        user = {"email": "admin@rtmis.com", "password": "Test105*"}
        user = self.client.post('/api/v1/login',
                                user,
                                content_type='application/json')
        user = user.json()
        call_command("form_seeder", "--test")
        form = Forms.objects.first()
        self.assertEqual(form.id, 1)
        self.assertEqual(form.name, "Test Form")
        # Add data to edit
        payload = {
            "data": {
                "name": "Testing Data",
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
        token = user.get("token")
        self.assertTrue(token)
        data = self.client.post('/api/v1/form-data/1/',
                                payload,
                                content_type='application/json',
                                **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data, {"message": "ok"})
        # Get all data from form
        data = self.client.get('/api/v1/form-data/1?page=1',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data['data']) > 0, True)
        data_id = data['data'][0]['id']
        # Get answer from data
        data = self.client.get(f'/api/v1/data/{data_id}',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data) > 0, True)
        self.assertEqual(data[0]['question'], 101)
        self.assertEqual(data[0]['value'], 'Jane')
        self.assertEqual(data[0]['history'], False)
        self.assertEqual(data[1]['question'], 102)
        self.assertEqual(data[1]['value'], ['Male'])
        self.assertEqual(data[1]['history'], False)
        # Update data for question 101 and 102
        payload = {
            "data": {
                "name": "Update Testing Data",
                "administration": 2,
                "geo": [6.2088, 106.8456]
            },
            "answer": [{
                "question": 101,
                "value": "Jane Doe"
            }, {
                "question": 102,
                "value": ["Female"]
            }]
        }
        data = self.client.put(f'/api/v1/form-data/1?data_id={data_id}',
                               payload,
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data, {"message": "direct update success"})
        # Get answer from data
        data = self.client.get(f'/api/v1/data/{data_id}',
                               content_type='application/json',
                               **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data) > 0, True)
        self.assertEqual(data[4]['question'], 101)
        self.assertEqual(data[4]['value'], 'Jane Doe')
        self.assertEqual(data[0]['history'], False)
        self.assertEqual(list(data[4]['history'][0]), [
            'value', 'created', 'created_by'])
        self.assertEqual(data[4]['history'][0]['value'], 'Jane')
        self.assertEqual(data[5]['question'], 102)
        self.assertEqual(data[5]['value'], ['Female'])
        self.assertEqual(list(data[5]['history'][0]), [
            'value', 'created', 'created_by'])
        self.assertEqual(data[5]['history'][0]['value'], ['Male'])
