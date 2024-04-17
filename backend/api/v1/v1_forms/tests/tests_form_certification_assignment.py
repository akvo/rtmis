from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from api.v1.v1_forms.models import (
    Forms,
    FormCertificationAssignment,
)
from api.v1.v1_profile.models import Administration, Levels


@override_settings(USE_TZ=False)
class FormCertificationAssignmentTestCase(TestCase):
    def setUp(self):
        call_command("form_seeder", "--test")
        call_command("administration_seeder", "--test")
        user = {"email": "admin@rush.com", "password": "Test105*"}
        user = self.client.post(
            "/api/v1/login", user, content_type="application/json"
        )
        user = user.json()
        token = user.get("token")
        self.header = {"HTTP_AUTHORIZATION": f"Bearer {token}"}
        # call_command("demo_approval_flow")
        self.form = Forms.objects.filter(type=1).first()
        # highest_level
        self.assignee_level = Levels.objects.filter(level=1).first()
        # lowest_level
        self.target_level = Levels.objects.filter(level=3).first()
        self.administration = Administration.objects.filter(
            level=self.assignee_level
        ).first()
        # get only id of the target administration
        self.target_administration = list(
            Administration.objects.filter(level=self.target_level).values_list(
                "id", flat=True
            )
        )

    def test_create_assignment(self):

        # Define assignment data
        assignment_data = {
            "assignee": self.administration.id,
            "administrations": self.target_administration,
        }

        # Create assignment using API
        response = self.client.post(
            "/api/v1/form/certification-assignment",
            assignment_data,
            content_type="application/json",
            **self.header,
        )
        self.assertEqual(response.status_code, 201)

        # Retrieve the created assignment
        assignment_id = response.json()["id"]
        response = self.client.get(
            f"/api/v1/form/certification-assignment/{assignment_id}",
            **self.header,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Check if data matches the created assignment
        self.assertEqual(data["assignee"]["id"], assignment_data["assignee"])
        self.assertEqual(
            [a["id"] for a in data["administrations"]],
            assignment_data["administrations"],
        )

    def test_update_assignment(self):
        # Create a sample assignment
        assignment = FormCertificationAssignment.objects.create(
            assignee=self.administration,
        )

        # Define updated assignment data
        updated_data = {
            "assignee": self.administration.id,
            "administrations": self.target_administration,
        }

        # Update assignment using API
        response = self.client.put(
            f"/api/v1/form/certification-assignment/{assignment.id}",
            updated_data,
            content_type="application/json",
            **self.header,
        )
        self.assertEqual(response.status_code, 200)

        # Retrieve the updated assignment
        response = self.client.get(
            f"/api/v1/form/certification-assignment/{assignment.id}",
            **self.header,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Check if data matches the updated assignment
        self.assertEqual(data["assignee"]["id"], updated_data["assignee"])
        self.assertEqual(
            [a["id"] for a in data["administrations"]],
            updated_data["administrations"],
        )

    def test_delete_assignment(self):

        # Create a sample assignment
        assignment = FormCertificationAssignment.objects.create(
            assignee=self.administration,
        )

        # Delete assignment using API
        response = self.client.delete(
            f"/api/v1/form/certification-assignment/{assignment.id}",
            **self.header,
        )
        self.assertEqual(response.status_code, 204)

        # Check if assignment is deleted
        with self.assertRaises(FormCertificationAssignment.DoesNotExist):
            FormCertificationAssignment.objects.get(id=assignment.id)
