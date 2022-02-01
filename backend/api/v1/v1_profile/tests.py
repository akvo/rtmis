from django.test import TestCase
from api.v1.v1_profile.models import Administration


class AdministrationTestCase(TestCase):
    """
    This test case is just an example.

    The tests are useless and only used during the initial setup to make sure
    the test runner is working. Please remove this and create a useful tests.
    """

    def test_initial_state(self):
        self.assertEqual(0, Administration.objects.count())
