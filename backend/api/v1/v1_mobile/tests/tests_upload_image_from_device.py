import os
from api.v1.v1_mobile.tests.mixins import AssignmentTokenTestHelperMixin
from rtmis.settings import STORAGE_PATH
from django.test import TestCase
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.models import Administration
from django.core.management import call_command
from api.v1.v1_mobile.models import MobileAssignment
from api.v1.v1_forms.models import Forms
from utils import storage


def generate_file(filename: str):
    f = open(filename, 'a')
    f.write('This is a test file!')
    f.close()
    return filename


class MobileAssignmentUploadImages(TestCase, AssignmentTokenTestHelperMixin):
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
        self.form = Forms.objects.first()
        self.passcode = 'passcode1234'
        MobileAssignment.objects.create_assignment(
            user=self.user, name='test', passcode=self.passcode
        )
        self.mobile_assignment = MobileAssignment.objects.get(user=self.user)
        self.mobile_assignment.forms.add(self.form)
        self.administration_children = Administration.objects.filter(
            parent=self.administration
        ).all()
        self.mobile_assignment.administrations.add(
            *self.administration_children
        )
        self.filename = generate_file(filename='test_image.jpg')

    # Delete Images after all finish
    def tearDown(self):
        os.remove(self.filename)

    def test_upload_image(self):
        token = self.get_assignmen_token(self.passcode)

        response = self.client.post(
            '/api/v1/device/images',
            {'file': open(self.filename, 'rb')},
            HTTP_AUTHORIZATION=f'Bearer {token}',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(list(response.json()), ['message', 'file'])
        uploaded_filename = response.json().get('file')
        uploaded_filename = uploaded_filename.split('/')[-1]
        self.assertTrue(
            storage.check(f"/images/{uploaded_filename}"),
            'File exists',
        )
        os.remove(f'{STORAGE_PATH}/images/{uploaded_filename}')

    def test_upload_image_without_credentials(self):
        response = self.client.post(
            '/api/v1/device/images',
            {'file': open(self.filename, 'rb')},
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json().get('detail'),
            'Authentication credentials were not provided.',
        )
