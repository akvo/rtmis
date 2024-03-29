from django.test import TestCase
from django.core.management import call_command
from api.v1.v1_users.models import SystemUser
from api.v1.v1_data.models import (
    FormData,
    PendingFormData,
    PendingDataBatch
)
from api.v1.v1_forms.models import Forms
from api.v1.v1_forms.constants import FormTypes, SubmissionTypes
from api.v1.v1_profile.models import Administration, Access
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_data.management.commands.fake_data_seeder import (
    add_fake_answers
)
from api.v1.v1_data.tasks import seed_approved_data


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
            parent__isnull=True
        ).first()
        role = UserRoleTypes.user
        self.user_access = Access.objects.create(
            user=self.user, role=role, administration=self.administration
        )
        self.uuid = '1234567890'
        self.form = Forms.objects.filter(type=FormTypes.county).first()
        self.data = FormData.objects.create(
            parent=None,
            uuid=self.uuid,
            form=self.form,
            administration=self.administration,
            created_by=self.user,
        )
        add_fake_answers(self.data, FormTypes.county)

    def test_parent_data(self):
        self.assertTrue(self.data.name)
        self.assertEqual(self.data.parent, None)
        self.assertEqual(self.data.uuid, self.uuid)
        self.assertEqual(self.data.form, self.form)
        self.assertEqual(self.data.administration, self.administration)
        self.assertEqual(self.data.created_by, self.user)
        self.assertTrue(self.data.data_answer.count() > 0)

    def test_seed_monitoring_batch(self):
        for i in range(2):
            pending_data = PendingFormData.objects.create(
                uuid=self.uuid if i == 0 else f'{self.uuid}{i}',
                form=self.form,
                administration=self.administration,
                created_by=self.user,
                submission_type=SubmissionTypes.monitoring if i == 0
                else SubmissionTypes.registration
            )
            add_fake_answers(pending_data,
                             form_type=FormTypes.county,
                             pending=True)
        self.assertTrue(PendingFormData.objects.count() == 2)
        batch = PendingDataBatch.objects.create(
            name='test batch',
            administration=self.administration,
            form=self.form,
            user=self.user,
            approved=True
        )
        batch.batch_pending_data_batch.add(*PendingFormData.objects.all())
        self.assertTrue(batch.batch_pending_data_batch.count() == 2)
        for pending_data in batch.batch_pending_data_batch.all():
            seed_approved_data(pending_data)
        self.assertTrue(FormData.objects.count() == 3)
        self.assertTrue(FormData.objects.first().submission_type,
                        SubmissionTypes.registration)
        child_data = FormData.objects.filter(
            parent__isnull=False
        )
        first_child = child_data.first()
        self.assertTrue(child_data.count() == 1)
        self.assertEqual(first_child.parent.uuid, self.uuid)
        self.assertEqual(self.data.children.first().id, first_child.id)
        self.assertEqual(self.data.children.count(), 1)
        self.assertNotEqual(self.data.submission_type,
                            first_child.submission_type)
        self.assertEqual(
            first_child.submission_type,
            SubmissionTypes.monitoring
        )
