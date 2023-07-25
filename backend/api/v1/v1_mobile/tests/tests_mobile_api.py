from django.core.management import call_command
from django.test import TestCase
from api.v1.v1_mobile.models import MobileFormAssignment
from api.v1.v1_users.models import SystemUser
from api.v1.v1_forms.models import Forms, UserForms
from api.v1.v1_profile.models import Administration, Access
from api.v1.v1_profile.constants import UserRoleTypes
from django.contrib.auth.hashers import check_password
from api.v1.v1_mobile.serializers import MobileFormAssignmentSerializer


class MobileFormAssignmentApiTest(TestCase):
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

    def test_mobile_form_assignment_api_get(self):
        """Test GET method for MobileFormAssignment API."""
        response = self.client.get("/api/v1/mobile-form-assignment/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertObjectHasKeys(response.data[0], ["id", "name", "forms"])
        self.assertEqual(
            response.data[0]["name"], self.mobile_form.name
        )
        self.assertEqual(
            response.data[0]["forms"][0]["name"],
            self.mobile_form.forms.first().name
        )

    def test_mobile_form_assignment_api_post(self):
        response = self.client.post("/api/v1/mobile-form-assignment/", {
            "name": "example assignment",
            "passcode": "1234",
            "forms": [Forms.objects.first().id],
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(MobileFormAssignment.objects.count(), 2)
        self.assertEqual(
            MobileFormAssignment.objects.last().name, "example assignment"
        )
        self.assertEqual(
            MobileFormAssignment.objects.last().forms.first().name,
            Forms.objects.first().name
        )

    def test_mobile_form_assignment_api_put(self):
        response = self.client.put(
            f"/api/v1/mobile-form-assignment/{self.mobile_form.id}/", {
                "name": "example assignment",
                "passcode": "1234",
                "forms": [Forms.objects.last().id],
            }
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(MobileFormAssignment.objects.count(), 1)
        self.assertEqual(
            MobileFormAssignment.objects.last().name, "example assignment"
        )
        self.assertEqual(
            MobileFormAssignment.objects.last().forms.last().name,
            Forms.objects.last().name
        )
