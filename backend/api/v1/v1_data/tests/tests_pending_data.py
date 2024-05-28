from typing import Union
from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from rest_framework_simplejwt.tokens import RefreshToken

from api.v1.v1_data.constants import DataApprovalStatus
from api.v1.v1_data.models import PendingFormData, PendingDataApproval, \
    PendingDataBatch, FormData
from api.v1.v1_forms.constants import FormTypes, QuestionTypes
from api.v1.v1_forms.models import Forms, Questions
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.management.commands.administration_seeder import (
        MAX_LEVEL_IN_SOURCE_FILE)
from api.v1.v1_profile.models import Administration
from api.v1.v1_users.models import SystemUser
from utils.functions import get_answer_value


@override_settings(USE_TZ=False)
class PendingDataTestCase(TestCase):
    def setUp(self) -> None:
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")

        admin_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         admin_payload,
                                         content_type='application/json')
        self.token = user_response.json().get('token')
        call_command('demo_approval_flow', "--test")

    def tests_pending_data(self):
        call_command('fake_pending_data_seeder', '-r', 1, '-t', True, '-b', 1)

        admin_user = SystemUser.objects.filter(
            user_access__role=UserRoleTypes.admin).first()
        if admin_user:
            t = RefreshToken.for_user(admin_user)
            header = {'HTTP_AUTHORIZATION': f'Bearer {t.access_token}'}
            response = self.client.get('/api/v1/form-pending-batch?page=1',
                                       content_type='application/json',
                                       **header)
            self.assertEqual(200, response.status_code)

            self.assertEqual(['current', 'total', 'total_page', 'batch'],
                             list(response.json()))

            if response.json().get('total') > 0:
                data = response.json().get('batch')
                self.assertEqual([
                    'id', 'name', 'form', 'administration', 'created_by',
                    'created', 'approver', 'approved', 'total_data'
                ], list(data[0]))
                response = self.client.get('/api/v1/pending-data/{0}'.format(
                    data[0].get('id')),
                    content_type='application/json',
                    **header)
                self.assertEqual(200, response.status_code)
                self.assertEqual(
                    ['history', 'question', 'value', 'last_value'],
                    list(response.json()[0])
                )
                response = self.client.get(
                    '/api/v1/form-pending-data-batch/{}'.format(data[0]['id']),
                    content_type='application/json',
                    **header)
                self.assertEqual(200, response.status_code)
                self.assertEqual([
                    'id', 'uuid', 'data_id', 'name', 'form', 'administration',
                    'geo', 'created_by', 'created'
                ], list(response.json()[0]))

        county_form = Forms.objects.filter(type=FormTypes.county).first()
        pending_form_data = PendingFormData.objects.filter(
            form=county_form).all()
        values = list(pending_form_data.values_list('id', flat=True))
        payload = {
            "name": "Test Batch",
            "data": values,
            'comment': 'Test comment'
        }
        response = self.client.post('/api/v1/batch',
                                    payload,
                                    content_type='application/json',
                                    **header)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get('message'),
                         'Data updated successfully')

        response = self.client.get('/api/v1/batch/comment/{0}'.format(
            PendingDataBatch.objects.last().id),
            follow=True,
            **header)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(list(response.json()[0]),
                         ['user', 'comment', 'created'])
        self.assertEqual(list(response.json()[0]['user']), ['name', 'email'])

        payload = {
            "name": "Test Batch",
            "data": values,
            'comment': 'Test comment'
        }
        response = self.client.post('/api/v1/batch',
                                    payload,
                                    content_type='application/json',
                                    **header)
        self.assertEqual(response.status_code, 400)

        response = self.client.get('/api/v1/batch?page=1',
                                   content_type='application/json',
                                   **header)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(list(response.json()['data'][0]), [
            'id', 'name', 'form', 'administration', 'file', 'total_data',
            'created', 'updated', 'status', 'approvers'
        ])

    def tests_pending_data_with_last_reponse(self):
        call_command("fake_data_seeder", "-r", 1, '-t', True)
        call_command("fake_data_monitoring_seeder", "-r", 1, '-t', True)
        pending_data = PendingFormData.objects.first()
        t = RefreshToken.for_user(pending_data.created_by)
        header = {'HTTP_AUTHORIZATION': f'Bearer {t.access_token}'}
        response = self.client.get(
            '/api/v1/pending-data/{0}'.format(pending_data.id),
            content_type='application/json',
            **header
        )
        data = FormData.objects.filter(
            uuid=pending_data.uuid
        ).order_by('-created').first()
        first_res = response.json()[0]
        question_id = first_res['question']
        answer = data.data_answer.filter(question_id=question_id).first()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(first_res['last_value'], get_answer_value(answer))

    def test_pending_batch_list(self):
        call_command('fake_pending_data_seeder', '-r', 5, '-t', True, '-b', 5)

        # get the lowest level approver
        approval: Union[PendingDataApproval, None] = PendingDataApproval\
            .objects.filter(level__level=MAX_LEVEL_IN_SOURCE_FILE - 1)\
            .first()
        t_child = RefreshToken.for_user(approval.user)
        header = {'HTTP_AUTHORIZATION': f'Bearer {t_child.access_token}'}
        # subordinate = false, approved = false
        response = self.client.get('/api/v1/form-pending-batch?page=1',
                                   content_type='application/json',
                                   **header)
        self.assertEqual(200, response.status_code)
        self.assertEqual(
            response.json().get('batch')[0]['approver']['status'],
            DataApprovalStatus.pending)
        self.assertTrue(
            response.json().get('batch')[0]['approver']['allow_approve'],
            "Should not allow approve")
        self.assertIn(
            'approval_instructions',
            response.json().get('batch')[0]['form'])
        # subordinate = true
        response = self.client.get(
            '/api/v1/form-pending-batch?page=1&subordinate=true',
            content_type='application/json',
            **header)
        self.assertEqual(200, response.status_code)
        self.assertEqual(0, len(response.json().get('batch')))

        # get parent level user
        p_approvals = PendingDataApproval.objects.filter(
            batch_id=approval.batch_id,
            level__level__lt=approval.level.level).order_by(
            '-level__level').all()
        p_approval = p_approvals[0]
        last_approval = p_approvals[1] if len(p_approvals) > 1 else None

        t_parent = RefreshToken.for_user(p_approval.user)

        header = {'HTTP_AUTHORIZATION': f'Bearer {t_parent.access_token}'}
        # subordinate = false, approved = false
        response = self.client.get(
            '/api/v1/form-pending-batch?page=1',
            content_type='application/json',
            **header
        )
        self.assertEqual(200, response.status_code)
        self.assertEqual(0, len(response.json().get('batch')))
        # subordinate = true
        response = self.client.get(
            '/api/v1/form-pending-batch?page=1&subordinate=true',
            content_type='application/json',
            **header)
        self.assertEqual(200, response.status_code)
        self.assertGreaterEqual(len(response.json().get('batch')), 1)

        # approve data with child
        payload = {
            'batch': approval.batch_id,
            'status': DataApprovalStatus.approved,
            'comment': 'Approved comment'
        }
        header = {'HTTP_AUTHORIZATION': f'Bearer {t_child.access_token}'}
        response = self.client.post('/api/v1/pending-data/approve',
                                    payload,
                                    content_type='application/json',
                                    **header)
        self.assertEqual(200, response.status_code)
        # approved = true
        response = self.client.get(
            '/api/v1/form-pending-batch?page=1&approved=true',
            content_type='application/json',
            **header)
        self.assertEqual(200, response.status_code)
        self.assertGreaterEqual(len(response.json().get('batch')), 1)

        # subordinate = false, approved = false
        header = {'HTTP_AUTHORIZATION': f'Bearer {t_parent.access_token}'}
        response = self.client.get(
            '/api/v1/form-pending-batch?page=1',
            content_type='application/json',
            **header)
        self.assertEqual(200, response.status_code)
        self.assertGreaterEqual(len(response.json().get('batch')), 1)

        # reject data with child
        payload = {
            'batch': approval.batch_id,
            'status': DataApprovalStatus.rejected,
            'comment': 'Rejected'
        }
        header = {'HTTP_AUTHORIZATION': f'Bearer {t_child.access_token}'}
        response = self.client.post('/api/v1/pending-data/approve',
                                    payload,
                                    content_type='application/json',
                                    **header)
        self.assertEqual(200, response.status_code)

        # check rejected in list. subordinate = true, approved = false
        header = {'HTTP_AUTHORIZATION': f'Bearer {t_parent.access_token}'}
        response = self.client.get(
            '/api/v1/form-pending-batch?page=1&subordinate=true',
            content_type='application/json',
            **header)
        self.assertEqual(200, response.status_code)
        self.assertGreaterEqual(len(response.json().get('batch')), 1)
        status = response.json().get('batch')[0].get('approver').get(
            'status')
        self.assertEqual(DataApprovalStatus.rejected, status)

        # check rejected not in list. subordinate = false, approved = false
        header = {'HTTP_AUTHORIZATION': f'Bearer {t_parent.access_token}'}
        rejected_response = self.client.get(
            '/api/v1/form-pending-batch?page=1',
            content_type='application/json',
            **header)
        self.assertEqual(200, rejected_response.status_code)
        self.assertGreaterEqual(len(rejected_response.json().get('batch')), 0)

        if last_approval:
            last_approval_access = RefreshToken.for_user(last_approval.user)
            last_approval_token = last_approval_access.access_token
            last_approval_header = {
                'HTTP_AUTHORIZATION': f'Bearer {last_approval_token}'
            }
            # check rejected not in list. subordinate = false, approved = false
            rejected_response = self.client.get(
                '/api/v1/form-pending-batch?page=1',
                content_type='application/json',
                **last_approval_header)
            self.assertEqual(200, rejected_response.status_code)
            res = len(rejected_response.json().get('batch'))
            self.assertGreaterEqual(res, 0)

        # update rejected data
        batch_id = response.json().get('batch')[0]['id']
        pending_data = PendingFormData.objects.filter(
            batch=batch_id).first()
        question = Questions.objects.filter(
            form=pending_data.form.id, type=QuestionTypes.text).first()
        payload = [{
            "question": question.id,
            "value": "Update after rejection"
        }]
        data = self.client.put(
            '/api/v1/form-pending-data/{0}?pending_data_id={1}'
            .format(pending_data.form.id, pending_data.id),
            payload,
            content_type='application/json',
            **header)
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data, {"message": "update success"})

        # check pending in list. subordinate = true, approved = false
        header = {'HTTP_AUTHORIZATION': f'Bearer {t_parent.access_token}'}
        response = self.client.get(
            '/api/v1/form-pending-batch?page=1&subordinate=true',
            content_type='application/json',
            **header)
        self.assertEqual(200, response.status_code)
        self.assertGreaterEqual(len(response.json().get('batch')), 1)
        status = response.json().get('batch')[0].get('approver').get(
            'status')
        self.assertEqual(DataApprovalStatus.pending, status)

    def test_batch_summary(self):
        call_command('fake_pending_data_seeder', '-r', 5, '-t', True, '-b', 5)
        header = {'HTTP_AUTHORIZATION': f'Bearer {self.token}'}
        response = self.client.get('/api/v1/batch/summary/{0}'.format(
            PendingDataBatch.objects.first().id),
            follow=True,
            **header)
        self.assertEqual(200, response.status_code)
        for summary in response.json():
            if summary.get('type') in \
                    [QuestionTypes.FieldStr.get(QuestionTypes.option),
                     QuestionTypes.FieldStr.get(
                         QuestionTypes.multiple_option)]:
                self.assertEqual(['type', 'total'],
                                 list(summary.get('value')[0]))
            else:
                self.assertIn(type(summary.get('value')), [float, int])


@override_settings(USE_TZ=False)
class SoftDeletesPendingDataTestCase(TestCase):
    def setUp(self):
        super().setUp()
        call_command("administration_seeder", "--test")
        self.administration = Administration.objects.last()
        self.user = SystemUser.objects.create(
            email='test@akvo.org', first_name='test', last_name='user')
        self.form = Forms.objects.create(name='test')

    def create_pending_data(self, name):
        return PendingFormData.objects.create(
            name=name,
            administration=self.administration,
            created_by=self.user,
            form=self.form)

    def test_initial_state(self):
        pending_data = self.create_pending_data('test')
        self.assertIsNone(pending_data.deleted_at)
        self.assertEqual(1, PendingFormData.objects.count())
        self.assertEqual(0, PendingFormData.objects_deleted.count())
        self.assertEqual(1, PendingFormData.objects_with_deleted.count())

    def test_soft_delete(self):
        pending_data = self.create_pending_data('test')
        pending_data.delete()
        self.assertIsNotNone(pending_data.deleted_at)
        self.assertEqual(0, PendingFormData.objects.count())
        self.assertEqual(1, PendingFormData.objects_deleted.count())
        self.assertEqual(1, PendingFormData.objects_with_deleted.count())

    def test_soft_delete_2(self):
        pending_data = self.create_pending_data('test')
        pending_data.soft_delete()
        self.assertIsNotNone(pending_data.deleted_at)
        self.assertEqual(0, PendingFormData.objects.count())
        self.assertEqual(1, PendingFormData.objects_deleted.count())
        self.assertEqual(1, PendingFormData.objects_with_deleted.count())

    def test_hard_delete(self):
        pending_data = self.create_pending_data('test')
        pending_data.delete(hard=True)
        self.assertEqual(0, PendingFormData.objects.count())
        self.assertEqual(0, PendingFormData.objects_deleted.count())
        self.assertEqual(0, PendingFormData.objects_with_deleted.count())

    def test_hard_delete_2(self):
        pending_data = self.create_pending_data('test')
        pending_data.hard_delete()
        self.assertEqual(0, PendingFormData.objects.count())
        self.assertEqual(0, PendingFormData.objects_deleted.count())
        self.assertEqual(0, PendingFormData.objects_with_deleted.count())

    def test_restore(self):
        pending_data = self.create_pending_data('test')
        pending_data.delete()

        self.assertEqual(1, PendingFormData.objects_deleted.count())

        tobe_restored = PendingFormData.objects_deleted.first()
        self.assertIsNotNone(tobe_restored.deleted_at)

        tobe_restored.restore()
        self.assertEqual(1, PendingFormData.objects.count())
        self.assertEqual(0, PendingFormData.objects_deleted.count())
        self.assertEqual(1, PendingFormData.objects_with_deleted.count())

    def test_bulk_soft_delete(self):
        self.create_pending_data('test #1')
        self.create_pending_data('test #2')
        self.create_pending_data('example')

        self.assertEqual(3, PendingFormData.objects.count())

        PendingFormData.objects.filter(name__startswith='test').delete()
        self.assertEqual(1, PendingFormData.objects.count())
        self.assertEqual(2, PendingFormData.objects_deleted.count())
        self.assertEqual(3, PendingFormData.objects_with_deleted.count())

    def test_bulk_soft_delete_2(self):
        self.create_pending_data('test #1')
        self.create_pending_data('test #2')
        self.create_pending_data('example')

        self.assertEqual(3, PendingFormData.objects.count())

        PendingFormData.objects.filter(name__startswith='test').soft_delete()
        self.assertEqual(1, PendingFormData.objects.count())
        self.assertEqual(2, PendingFormData.objects_deleted.count())
        self.assertEqual(3, PendingFormData.objects_with_deleted.count())

    def test_bulk_hard_delete(self):
        self.create_pending_data('test #1')
        self.create_pending_data('test #2')
        self.create_pending_data('example')

        PendingFormData.objects.filter(
            name__startswith='test').delete(hard=True)
        self.assertEqual(1, PendingFormData.objects.count())
        self.assertEqual(0, PendingFormData.objects_deleted.count())
        self.assertEqual(1, PendingFormData.objects_with_deleted.count())

    def test_bulk_hard_delete_2(self):
        self.create_pending_data('test #1')
        self.create_pending_data('test #2')
        self.create_pending_data('example')

        PendingFormData.objects.filter(
            name__startswith='test').hard_delete()
        self.assertEqual(1, PendingFormData.objects.count())
        self.assertEqual(0, PendingFormData.objects_deleted.count())
        self.assertEqual(1, PendingFormData.objects_with_deleted.count())

    def test_bulk_restore(self):
        self.create_pending_data('test #1')
        self.create_pending_data('test #2')
        self.create_pending_data('example')

        PendingFormData.objects.delete()
        self.assertEqual(0, PendingFormData.objects.count())
        self.assertEqual(3, PendingFormData.objects_deleted.count())
        self.assertEqual(3, PendingFormData.objects_with_deleted.count())

        PendingFormData.objects_with_deleted.filter(
            name__startswith='test').restore()
        self.assertEqual(2, PendingFormData.objects.count())
        self.assertEqual(1, PendingFormData.objects_deleted.count())
        self.assertEqual(3, PendingFormData.objects_with_deleted.count())
