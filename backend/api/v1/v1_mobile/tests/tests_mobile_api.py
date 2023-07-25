from django.core.management import call_command
from django.test import TestCase
from api.v1.v1_mobile.models import MobileFormAssignment
from api.v1.v1_users.models import SystemUser
from api.v1.v1_forms.models import Forms
from api.v1.v1_profile.models import Administration, Access
from api.v1.v1_profile.constants import UserRoleTypes
# from django.contrib.auth.hashers import check_password


class MobileFormAssignmentApiTest(TestCase):
    def setUp(self):
        # Create a test SystemUser for ForeignKey relationship
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")
        self.user = SystemUser.objects._create_user(
            email="test@test.org",
            password="Test",
            first_name="Test",
            last_name="User"
        )
        self.administration = Administration.objects.last()
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
        user_payload = {"email": "test@test.org", "password": "Test"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        token = user_response.json().get('token')
        headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        response = self.client.get("/api/v1/mobile-form-assignment/",
                                   content_type='application/json',
                                   **headers)
        response_json = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        for json in response_json:
            del json['id']
        self.assertEqual(response_json, [{
                "name": "example assignment",
                "forms": [],
        }])

#    def test_mobile_form_assignment_api_post(self):
#        response = self.client.post("/api/v1/mobile-form-assignment/", {
#            "name": "example assignment",
#            "passcode": "1234",
#            "forms": [Forms.objects.first().id],
#        })
#        self.assertEqual(response.status_code, 201)
#        self.assertEqual(MobileFormAssignment.objects.count(), 2)
#        self.assertEqual(
#            MobileFormAssignment.objects.last().name, "example assignment"
#        )
#        self.assertEqual(
#            MobileFormAssignment.objects.last().forms.first().name,
#            Forms.objects.first().name
#        )
#
#    def test_mobile_form_assignment_api_put(self):
#        response = self.client.put(
#            f"/api/v1/mobile-form-assignment/{self.mobile_form.id}/", {
#                "name": "example assignment",
#                "passcode": "1234",
#                "forms": [Forms.objects.last().id],
#            }
#        )
#        self.assertEqual(response.status_code, 200)
#        self.assertEqual(MobileFormAssignment.objects.count(), 1)
#        self.assertEqual(
#            MobileFormAssignment.objects.last().name, "example assignment"
#        )
#        self.assertEqual(
#            MobileFormAssignment.objects.last().forms.last().name,
#            Forms.objects.last().name
#        )
