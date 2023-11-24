from django.test import TestCase
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.models import Administration, Access
from api.v1.v1_profile.constants import UserRoleTypes
from django.core.management import call_command
from api.v1.v1_mobile.models import MobileAssignment
from api.v1.v1_forms.models import Forms, UserForms
from api.v1.v1_data.models import PendingFormData, PendingAnswers
from rest_framework import status


class MobileAssignmentApiSyncTest(TestCase):
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
            parent__isnull=True
        ).first()
        role = UserRoleTypes.user
        self.user_access = Access.objects.create(
            user=self.user, role=role, administration=self.administration
        )
        self.form = Forms.objects.first()
        UserForms.objects.create(user=self.user, form=self.form)
        self.passcode = 'passcode1234'
        MobileAssignment.objects.create_assignment(
            user=self.user, passcode=self.passcode
        )
        self.mobile_assignment = MobileAssignment.objects.get(user=self.user)
        self.token = self.mobile_assignment.token

    def test_mobile_sync_to_pending_datapoint(self):
        response = self.client.get(
            f'/api/v1/device/form/{self.form.id}',
            follow=True,
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {self.token}'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        json_form = response.json()
        questions = []
        json_form['question_group']
        for question_group in json_form['question_group']:
            for question in question_group['question']:
                questions.append(question)

        answers = {}
        for question in questions:
            if question['type'] == 'option':
                answers[question['id']] = [question['option'][0]['name']]
            elif question['type'] == 'multiple_option':
                answers[question['id']] = [question['option'][0]['name']]
            elif question['type'] == 'number':
                answers[question['id']] = 12
            elif question['type'] == 'geo':
                answers[question['id']] = [0, 0]
            elif question['type'] == 'date':
                answers[question['id']] = '2021-01-01T00:00:00.000Z'
            elif question['type'] == 'photo':
                answers[question['id']] = 'https://picsum.photos/200/300'
            elif question['type'] == 'cascade':
                answers[question['id']] = Administration.objects.last().id
            else:
                answers[question['id']] = 'testing'

        post_data = {
            'formId': self.form.id,
            'name': 'testing datapoint',
            'duration': 3000,
            'submittedAt': '2021-01-01T00:00:00.000Z',
            'submitter': 'Test Enumerator',
            'geo': [0, 0],
            'answers': answers,
        }

        self.assertEqual(len(answers), len(questions))

        # Submit correct data
        response = self.client.post(
            '/api/v1/device/sync',
            post_data,
            follow=True,
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {self.token}'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        pending_data = PendingFormData.objects.filter(
            created_by=self.user
        ).all()
        self.assertEqual(pending_data.count(), 1)
        answer_data = PendingAnswers.objects.filter(
            pending_data=pending_data[0]
        ).count()
        self.assertEqual(answer_data, len(list(answers)))
        self.assertTrue(pending_data[0].geo, [0, 0])
        self.assertEqual(pending_data[0].submitter, 'Test Enumerator')
        self.assertEqual(pending_data[0].duration, 3000)

        # Submit with invalid token
        #
        response = self.client.post(
            '/api/v1/device/sync',
            post_data,
            follow=True,
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': 'Bearer eyjsomethinginvalid'},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Submit invalid request
        response = self.client.post(
            '/api/v1/device/sync',
            {},  # everything is is empty
            follow=True,
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {self.token}'},
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        response = self.client.post(
            '/api/v1/device/sync',
            {'formId': self.form.id},  # required params is incomplete
            follow=True,
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {self.token}'},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Submit with invalid data
        response = self.client.post(
            '/api/v1/device/sync',
            {
                'formId': self.form.id,
                'name': 'testing datapoint',
                'duration': 3000,
                'submittedAt': '2021-01-01T00:00:00.000Z',
                'submitter': 'Test Enumerator',
                'geo': [0, 0],
                'answers': {'1': 'testing'},
            },  # data is empty
            follow=True,
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {self.token}'},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
