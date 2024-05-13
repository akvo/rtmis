from django.test import TestCase
from django.core.management import call_command
from api.v1.v1_users.models import SystemUser
from api.v1.v1_data.models import FormData
from api.v1.v1_forms.models import Forms
from api.v1.v1_forms.constants import FormTypes, SubmissionTypes
from api.v1.v1_profile.models import Administration, Access
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_data.management.commands.fake_data_seeder import (
    add_fake_answers
)


class MonitoringDataTestCase(TestCase):
    def setUp(self):
        call_command('administration_seeder', '--test')
        call_command('form_seeder', '--test')
        self.user = SystemUser.objects.create_user(
            email='test@test.org',
            password='test1234',
            first_name='test',
            last_name='testing',
        )
        self.administration = Administration.objects.filter(
            level__level=1
        ).first()
        role = UserRoleTypes.admin
        self.user_access = Access.objects.create(
            user=self.user, role=role, administration=self.administration
        )
        self.uuid = '1234567890'
        self.form = Forms.objects.filter(type=FormTypes.county).first()
        self.adm_data = Administration.objects.filter(
            level__level=2,
            path__startswith=self.administration.path
        ).first()
        self.data = FormData.objects.create(
            parent=None,
            uuid=self.uuid,
            form=self.form,
            administration=self.adm_data,
            created_by=self.user,
        )
        add_fake_answers(self.data, FormTypes.county)

        # Login as an admin
        admin = {"email": self.user.email, "password": 'test1234'}
        admin = self.client.post(
            '/api/v1/login',
            admin,
            content_type='application/json'
        )
        admin = admin.json()
        self.token = admin.get("token")

    def test_parent_data(self):
        data = self.client.get(
            f"/api/v1/form-data/{self.form.id}",
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {self.token}'}
        )
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data['total'], 1)
        self.assertEqual(data['data'][0]['uuid'], self.uuid)

    def test_update_parent_data(self):
        payload = [
            {
                "question": 101,
                "value": "Edit"
            }
        ]
        edit = self.client.put(
            f'/api/v1/form-data/{self.form.id}?data_id={self.data.id}',
            payload,
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {self.token}'}
        )
        self.assertEqual(edit.status_code, 200)

        data = self.client.get(
            f"/api/v1/form-data/1/{self.form.id}?submission_type=1",
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {self.token}'}
        )
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data['total'], 1)

        answers = self.client.get(
            f'/api/v1/data/{self.data.id}',
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {self.token}'}
        )
        self.assertEqual(answers.status_code, 200)
        answers = answers.json()
        find_answer = list(filter(lambda a: a['question'] == 101, answers))
        self.assertEqual(len(find_answer), 1)
        self.assertNotEqual(find_answer[0]['history'], None)
        self.assertEqual(find_answer[0]['value'], 'Edit')

    def test_add_new_monitoring(self):
        monitoring = FormData.objects.create(
            uuid=self.uuid,
            form=self.form,
            administration=self.administration,
            created_by=self.user,
            submission_type=SubmissionTypes.monitoring,
        )
        add_fake_answers(monitoring, form_type=FormTypes.county)

        data = self.client.get(
            f"/api/v1/form-data/1/{self.form.id}?submission_type=1",
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {self.token}'}
        )
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data['total'], 1)
        api_url = f"/api/v1/form-data/1/{self.form.id}"
        api_url += f"?parent={monitoring.id}&submission_type=2"
        data_parent = self.client.get(
            api_url,
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {self.token}'}
        )
        self.assertEqual(data_parent.status_code, 200)
        data_parent = data_parent.json()
        self.assertEqual(data_parent['total'], 2)

        self.assertEqual(data_parent['data'][0]['name'], monitoring.name)

    def test_get_latest_data(self):
        for m in range(2):
            monitoring = FormData.objects.create(
                uuid=self.uuid,
                form=self.form,
                administration=self.adm_data,
                created_by=self.user,
            )
            add_fake_answers(monitoring, form_type=FormTypes.county)
        lastest = FormData.objects.order_by('-created').first()
        data = self.client.get(
            f"/api/v1/form-data/1/{self.form.id}",
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {self.token}'}
        )
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data['total'], 1)
        self.assertEqual(data['data'][0]['name'], lastest.name)
        self.assertEqual(
            list(data['data'][0]),
            ['id', 'uuid', 'name', 'form', 'administration',
             'geo', 'created_by', 'updated_by', 'created', 'updated',
             'pending_data', 'submission_type'])
