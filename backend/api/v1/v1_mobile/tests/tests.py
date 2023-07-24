from django.core.management import call_command
from django.test import TestCase
from api.v1.v1_mobile.models import Mobile
from api.v1.v1_users.models import SystemUser
from api.v1.v1_forms.models import Forms, UserForms
from api.v1.v1_profile.models import Administration, Access
from api.v1.v1_profile.constants import UserRoleTypes


def add_mobile_forms(user, mobile, forms):
    """Helper function to add forms to a mobile."""
    user_forms = UserForms.objects.filter(user=user).all()
    user_forms = [uf.form for uf in user_forms]
    for form in forms:
        if form in user_forms:
            mobile.forms.add(form)
    return mobile


class MobileModelTest(TestCase):

    def setUp(self):
        # Create a test SystemUser for ForeignKey relationship
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")
        self.user = SystemUser.objects.create(email='test@test.org',
                                              first_name='Test',
                                              last_name='User')
        # Create a test Mobile instance
        self.mobile = Mobile.objects.create(name='example assignment',
                                            user=self.user,
                                            mobile_passcode='1234')
        self.administration = Administration.objects.filter(
            parent__isnull=True).first()
        role = UserRoleTypes.user
        self.user_access = Access.objects.create(
            user=self.user, role=role, administration=self.administration)

    def test_mobile_creation(self):
        """Test that Mobile instance is created correctly."""
        self.assertIsInstance(self.mobile, Mobile)
        self.assertEqual(self.mobile.mobile_passcode, '1234')

    def test_mobile_user_relationship(self):
        """Test Many-to-One relationship with SystemUser."""
        self.assertEqual(self.mobile.user, self.user)

    def test_mobile_forms_relationship(self):
        """Test Many-to-Many relationship with Form."""
        form = Forms.objects.first()
        self.mobile.forms.add(form)

        # Check if the form is associated with the mobile
        self.assertIn(form, self.mobile.forms.all())
        self.assertEqual(form, self.mobile.forms.first())
        self.assertEqual(form.mobiles.first().user.email, self.user.email)

    def test_mobile_str_representation(self):
        """Test __str__ method for Mobile model."""
        expected_str = f'Mobile: {self.mobile.id} {self.mobile.name}'
        self.assertEqual(str(self.mobile), expected_str)

    def test_mobile_has_many_forms(self):
        """Test that Mobile can have many Forms."""
        forms = Forms.objects.all()
        self.assertEqual(forms.count(), 2)
        self.mobile.forms.add(forms[0])
        self.mobile.forms.add(forms[1])
        self.assertEqual(self.mobile.forms.count(), 2)

    def test_add_mobile_forms(self):
        """Test helper function add_mobile_forms."""
        forms = Forms.objects.all()
        user_forms = UserForms.objects.create(form=forms[0], user=self.user)
        self.assertEqual(user_forms, UserForms.objects.first())
        self.assertEqual(forms.count(), 2)
        self.mobile = add_mobile_forms(self.user, self.mobile, forms)
        self.assertEqual(self.mobile.forms.count(), 1)
        """Only success if user has right access to the form"""
        UserForms.objects.create(form=forms[1], user=self.user)
        self.mobile = add_mobile_forms(self.user, self.mobile, forms)
        self.assertEqual(self.mobile.forms.count(), 2)
