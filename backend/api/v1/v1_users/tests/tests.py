from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings

from api.v1.v1_profile.models import Access
from api.v1.v1_profile.models import Administration, Levels
from api.v1.v1_users.models import SystemUser, Organisation


@override_settings(USE_TZ=False)
class SystemUserTestCase(TestCase):
    """
    This test case is just an example.

    The tests are useless and only used during the initial setup to make sure
    the test runner is working. Please remove this and create a useful tests.
    """
    def test_initial_state(self):
        self.assertEqual(0, SystemUser.objects.count())

    def test_create_user(self):
        SystemUser.objects.create(email='test@example.com')

        self.assertEqual(1, SystemUser.objects.count())
        user = SystemUser.objects.first()
        self.assertEqual('test@example.com', user.email)

    def test_create_super_user(self):
        call_command("createsuperuser",
                     interactive=False,
                     email="admin@rush.com",
                     first_name="Admin",
                     last_name="RUSH")
        call_command("administration_seeder", "--test")
        call_command("fake_organisation_seeder", "--repeat", 3)
        user = SystemUser.objects.first()
        organisation = Organisation.objects.first()
        user.organisation = organisation
        user.save()
        self.assertEqual('admin@rush.com', user.email)
        self.assertTrue(user.is_superuser)
        self.assertEqual('Admin', user.first_name)
        self.assertEqual(organisation.id, user.organisation.id)
        call_command("assign_access", user.email, "--test")
        access = Access.objects.first()
        self.assertEqual(access.user, user)


@override_settings(USE_TZ=False)
class SystemUserEndpointsTestCase(TestCase):
    def test_health_check(self):
        response = self.client.get('/api/v1/health/check',
                                   HTTP_ACCEPT='application/json')

        self.assertEqual(200, response.status_code)
        data = response.json()
        self.assertEqual('OK', data['message'])

    def test_login(self):
        level = Levels(name="country", level=1)
        level.save()
        administration = Administration(name="Indonesia",
                                        parent=None,
                                        level=level)
        administration.save()
        self.assertEqual(0, SystemUser.objects.count())
        user = {"email": "admin@rush.com", "password": "Test105*"}
        user = self.client.post('/api/v1/login',
                                user,
                                content_type='application/json')
        self.assertEqual(1, SystemUser.objects.count())
        user = user.json()

        self.assertEqual(set([
            "email", "name", "administration", "trained", "role",
            'phone_number', 'designation', 'forms', "organisation",
            "last_login", "passcode", "token", "certification", "invite",
            "expiration_time",
        ]), set(list(user)))

        user = {"email": "admin@rush.com", "password": "Test105"}
        user = self.client.post('/api/v1/login',
                                user,
                                content_type='application/json')
        self.assertEqual(user.status_code, 401)

        user = {"email": "admin@rush.com"}
        user = self.client.post('/api/v1/login',
                                user,
                                content_type='application/json')
        self.assertEqual(user.status_code, 400)

        # test forgor password to valid email
        user = {"email": "admin@rush.com"}
        user = self.client.post('/api/v1/user/forgot-password',
                                user,
                                content_type='application/json')
        self.assertEqual(user.status_code, 200)
        # test forgor password to invalid email
        user = {"email": "notuser@domain.com"}
        user = self.client.post('/api/v1/user/forgot-password',
                                user,
                                content_type='application/json')
        self.assertEqual(user.status_code, 400)
