from rtmis.settings import WEBDOMAIN
from django.test import TestCase
from api.v1.v1_mobile.models import MobileAssignment
from api.v1.v1_profile.models import Administration, Access
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_forms.models import Forms
from api.v1.v1_forms.constants import FormTypes
from api.v1.v1_data.models import FormData
from api.v1.v1_users.models import SystemUser
from django.core.management import call_command
from rest_framework import status


class MobileDataPointDownloadListTestCase(TestCase):
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
        self.forms = Forms.objects.filter(
            type=FormTypes.county
        ).all()
        self.uuid = '1234'
        self.passcode = 'passcode1234'
        self.mobile_assignment = MobileAssignment.objects.create_assignment(
            user=self.user, name='test', passcode=self.passcode
        )
        self.administration_children = Administration.objects.filter(
            parent=self.administration
        ).all()
        self.mobile_assignment.administrations.add(
            *self.administration_children
        )
        self.mobile_assignment = MobileAssignment.objects.get(user=self.user)
        self.mobile_assignment.forms.add(*self.forms)
        self.form_data = FormData.objects.create(
            name="TEST",
            geo=None,
            form=self.forms[0],
            administration=self.administration_children.first(),
            created_by=self.user,
            uuid=self.uuid,
        )

    def test_get_datapoints_list_url(self):
        code = {'code': self.passcode}
        response = self.client.post(
            '/api/v1/device/auth',
            code,
            content_type='application/json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data['syncToken']
        url = "/api/v1/device/datapoint-list/"
        response = self.client.get(
            url,
            follow=True,
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {token}'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["total"], 1)
        self.assertEqual(data["data"][0]["id"], self.form_data.id)
        self.assertEqual(data["data"][0]["name"], self.form_data.name)
        self.assertEqual(data["data"][0]["form_id"], self.forms[0].id)
        self.assertFalse(self.mobile_assignment.last_synced_at, None)
        # test if url is correct
        self.assertEqual(
            data["data"][0]["url"],
            f"{WEBDOMAIN}/datapoints/{self.uuid}.json"
        )
        self.assertEqual(
            list(data["data"][0]),
            ["id", "form_id", "name", "url", "last_updated"]
        )
