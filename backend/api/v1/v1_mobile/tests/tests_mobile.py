from django.core.management import call_command
from django.test import TestCase
from api.v1.v1_mobile.models import MobileFormAssignment
from api.v1.v1_users.models import SystemUser
from api.v1.v1_forms.models import Forms, UserForms
from api.v1.v1_profile.models import Administration, Access
from api.v1.v1_profile.constants import UserRoleTypes
from django.contrib.auth.hashers import check_password
from api.v1.v1_mobile.serializers import MobileFormAssignmentSerializer


class MobileFormAssignmentModelTest(TestCase):
    def setUp(self):
        # Create a test SystemUser for ForeignKey relationship
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")
        self.user = SystemUser.objects.create(
            email="test@test.org", first_name="Test", last_name="User"
        )
        self.administration = Administration.objects.filter(
            parent__isnull=True
        ).first()
        role = UserRoleTypes.user
        self.user_access = Access.objects.create(
            user=self.user, role=role, administration=self.administration
        )
        # Create a test Mobile instance
        form = Forms.objects.first()
        self.mobile_form = MobileFormAssignment.objects.create(
            name="example assignment",
            user=self.user,
            passcode="1234",
            forms=[form],
        )

    def test_mobile_form_creation(self):
        """Test that Mobile instance is created correctly."""
        self.assertIsInstance(self.mobile_form, MobileFormAssignment)
        self.assertNotEqual(self.mobile_form.passcode, "1234")
        self.assertTrue(self.mobile_form.passcode.startswith("pbkdf2_sha256$"))
        self.assertTrue(check_password("1234", self.mobile_form.passcode))

    def test_mobile_form_user_relationship(self):
        """Test Many-to-One relationship with SystemUser."""
        self.assertEqual(self.mobile_form.user, self.user)

    def test_mobile_form_forms_relationship(self):
        """Test Many-to-Many relationship with Form."""
        form = Forms.objects.first()
        self.mobile_form.forms.add(form)

        # Check if the form is associated with the mobile
        self.assertIn(form, self.mobile_form.forms.all())
        self.assertEqual(form, self.mobile_form.forms.first())
        self.assertEqual(form.mobiles.first().user.email, self.user.email)

    def test_mobileform_str_representation(self):
        """Test __str__ method for Mobile model."""
        expected_str = f"Mobile: {self.mobile_form.id} {self.mobile_form.name}"
        self.assertEqual(str(self.mobile_form), expected_str)

    def test_mobileform_has_many_forms(self):
        """Test that Mobile can have many Forms."""
        forms = Forms.objects.all()
        self.assertEqual(forms.count(), 2)
        self.mobile_form.forms.add(forms[0])
        self.mobile_form.forms.add(forms[1])
        self.assertEqual(self.mobile_form.forms.count(), 2)

    def test_add_mobile_forms(self):
        """Test helper function add_mobile_forms."""
        forms = Forms.objects.all()
        user_forms = UserForms.objects.create(form=forms[0], user=self.user)
        self.assertEqual(user_forms, UserForms.objects.first())
        self.assertEqual(forms.count(), 2)
        """Only success if user has right access to the form"""
        MobileFormAssignment.objects.add_form(self.user, forms)
        self.assertEqual(self.mobile_form.forms.count(), 1)
        UserForms.objects.create(form=forms[1], user=self.user)
        MobileFormAssignment.objects.add_form(self.user, forms)
        self.assertEqual(self.mobile_form.forms.count(), 2)

    def test_remove_mobile_forms(self):
        """Test helper function remove_mobile_forms."""
        forms = Forms.objects.all()
        user_forms = UserForms.objects.create(form=forms[0], user=self.user)
        self.assertEqual(user_forms, UserForms.objects.first())
        self.assertEqual(forms.count(), 2)
        """Only success if user has right access to the form"""
        MobileFormAssignment.objects.add_form(self.user, forms)
        self.assertEqual(self.mobile_form.forms.count(), 1)
        UserForms.objects.create(form=forms[1], user=self.user)
        MobileFormAssignment.objects.add_form(self.user, forms)
        self.assertEqual(self.mobile_form.forms.count(), 2)
        MobileFormAssignment.objects.remove_form(self.user, forms)
        self.assertEqual(self.mobile_form.forms.count(), 0)

    def test_mobile_forms_serializer(self):
        """Test MobileFormAssignmentSerializer."""

        forms = Forms.objects.all()
        UserForms.objects.create(form=forms[0], user=self.user)
        MobileFormAssignment.objects.add_form(self.user, forms)
        serializer = MobileFormAssignmentSerializer(self.mobile_form)
        self.assertEqual(serializer.data["id"], self.mobile_form.id)
        self.assertEqual(serializer.data["name"], self.mobile_form.name)
        self.assertEqual(len(serializer.data["forms"]), 1)
        self.assertEqual(serializer.data["forms"][0]["form_id"], forms[0].id)
        self.assertEqual(serializer.data["forms"][0]["name"], forms[0].name)
