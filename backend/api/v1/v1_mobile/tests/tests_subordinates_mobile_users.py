import typing
from django.core.management import call_command
from django.http import HttpResponse
from django.test import TestCase, override_settings
from rest_framework_simplejwt.tokens import RefreshToken

from api.v1.v1_forms.models import Forms, UserForms
from api.v1.v1_profile.models import SystemUser, Administration, Levels
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_mobile.models import MobileAssignment
from api.v1.v1_profile.tests.mixins import ProfileTestHelperMixin


@override_settings(USE_TZ=False)
class SubordinatesMobileUsersTestCase(TestCase, ProfileTestHelperMixin):

    def setUp(self):
        super().setUp()
        call_command("administration_seeder", "--test")
        call_command('form_seeder', '--test')
        last_level = Levels.objects.order_by('-id').first()
        administration = Administration.objects.filter(
            level=last_level
        ).first()
        self.user = self.create_user(
            email='user@akvo.org',
            role_level=self.ROLE_USER,
            password='password',
            administration=administration
        )
        self.approver = self.create_user(
            email='approver@akvo.org',
            role_level=self.ROLE_APPROVER,
            password='password',
            administration=administration.parent
        )
        self.token = self.get_auth_token(self.user.email)
        form = Forms.objects.first()
        self.form = form
        UserForms.objects.get_or_create(form=form, user=self.user)
        UserForms.objects.get_or_create(form=form, user=self.approver)

    def test_subordinates_mobile_users_list(self):
        payload = {
            'name': 'user1 assignment',
            'forms': [self.form.id],
            'administrations': [self.user.user_access.administration.id],
        }

        response = typing.cast(
                HttpResponse,
                self.client.post(
                    '/api/v1/mobile-assignments',
                    payload,
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 201)

        # Login as Sub-county user
        t = RefreshToken.for_user(self.approver)

        response = typing.cast(
                HttpResponse,
                self.client.get(
                    '/api/v1/mobile-assignments',
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {t.access_token}'))
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(len(body['data']), 1)

    def test_same_level_mobile_users_list(self):
        payload = {
            'name': 'user2 assignment',
            'forms': [self.form.id],
            'administrations': [self.user.user_access.administration.id],
        }

        response = typing.cast(
                HttpResponse,
                self.client.post(
                    '/api/v1/mobile-assignments',
                    payload,
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))
        self.assertEqual(response.status_code, 201)
        assignment = MobileAssignment.objects.get(name='user2 assignment')
        self.assertIsNotNone(assignment.pk)

        # login with other users of the same level
        same_level_user = SystemUser.objects.filter(
            user_access__role=UserRoleTypes.user
        ).first()
        [self.user.user_access.administration.id],
        t = RefreshToken.for_user(same_level_user)

        response = typing.cast(
                HttpResponse,
                self.client.get(
                    '/api/v1/mobile-assignments',
                    content_type="application/json",
                    HTTP_AUTHORIZATION=f'Bearer {t.access_token}'))
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(len(body['data']), 1)
        self.assertTrue(True)
