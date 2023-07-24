from django.core.management import call_command
from django.test import TestCase
from api.v1.v1_mobile.models import Mobile
from api.v1.v1_users.models import SystemUser
from api.v1.v1_forms.models import Forms


class MobileModelTest(TestCase):
    def setUp(self):
        # Create a test SystemUser for ForeignKey relationship
        self.user = SystemUser.objects.create(
            email='test@akvo.org',
            first_name='Test',
            last_name='User'
        )
        # Create a test Mobile instance
        self.mobile = Mobile.objects.create(
            user=self.user,
            mobile_passcode='1234'
        )

    def test_mobile_creation(self):
        """Test that Mobile instance is created correctly."""
        self.assertIsInstance(self.mobile, Mobile)
        self.assertEqual(self.mobile.mobile_passcode, '1234')

    def test_mobile_user_relationship(self):
        """Test Many-to-One relationship with SystemUser."""
        self.assertEqual(self.mobile.user, self.user)

    def test_mobile_forms_relationship(self):
        """Test Many-to-Many relationship with Form."""
        call_command("form_seeder", "--test")
        call_command("administration_seeder", "--test")
        form = Forms.objects.first()
        self.mobile.forms.add(form)

        # Check if the form is associated with the mobile
        self.assertIn(form, self.mobile.forms.all())
        self.assertEqual(form, self.mobile.forms.first())
        self.assertEqual(form.mobiles.first().user.email, self.user.email)

    def test_mobile_str_representation(self):
        """Test __str__ method for Mobile model."""
        expected_str = f'Mobile: {self.mobile.id}'
        self.assertEqual(str(self.mobile), expected_str)
