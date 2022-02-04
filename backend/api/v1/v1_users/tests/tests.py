from django.test import TestCase
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.models import Administration, Levels


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


class SystemUserEndpointsTestCase(TestCase):
    def test_health_check(self):
        response = self.client.get('/api/v1/health/check/',
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
        user = {"email": "admin@rtmis.com", "password": "Test105*"}
        user = self.client.post('/api/v1/login/',
                                user,
                                content_type='application/json')
        self.assertEqual(1, SystemUser.objects.count())
        user = user.json()
        self.assertEqual(["email", "name", "token", "invite"], list(user))
