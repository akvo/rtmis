from django.test import TestCase
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.models import Administration, Access
from api.v1.v1_profile.constants import UserRoleTypes
from django.core.management import call_command
from api.v1.v1_mobile.models import MobileAssignment
from api.v1.v1_forms.models import Forms, UserForms
from rest_framework import status


class MobileAssignmentApiTest(TestCase):
    def setUp(self):
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")
        self.user = SystemUser.objects.create_user(
            email="test@test.org",
            password="test1234",
            first_name="test",
            last_name="testing",
        )
        self.administration = Administration.objects.filter(parent__isnull=True).first()
        role = UserRoleTypes.user
        self.user_access = Access.objects.create(
            user=self.user, role=role, administration=self.administration
        )
        self.forms = Forms.objects.all()
        for form in self.forms:
            UserForms.objects.create(user=self.user, form=form)
        self.passcode = "passcode1234"
        MobileAssignment.objects.create_assignment(
            user=self.user, passcode=self.passcode
        )
        self.mobile_assignment = MobileAssignment.objects.get(user=self.user)

    def test_mobile_assignment_form_list_serializer(self):
        from api.v1.v1_mobile.serializers import MobileAssignmentFormsSerializer

        serializer = MobileAssignmentFormsSerializer(self.mobile_assignment)
        self.assertEqual(serializer.data["syncToken"], self.mobile_assignment.token)
        self.assertEqual(
            dict(serializer.data["formsUrl"][0]),
            {
                "id": self.forms[0].id,
                "version": str(self.forms[0].version),
                "url": f"/form/{self.forms[0].id}",
            },
        )

    def test_mobile_assignment_form_api(self):

        code = {"code": self.passcode}
        response = self.client.post(
            "/api/v1/device/auth",
            code,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["syncToken"], self.mobile_assignment.token)
        self.assertEqual(
            dict(response.data["formsUrl"][0]),
            {
                "id": self.forms[0].id,
                "version": str(self.forms[0].version),
                "url": f"/form/{self.forms[0].id}",
            },
        )

    def test_mobile_assignment_form_api_of_admin(self):

        # delete all user forms
        UserForms.objects.all().delete()
        code = {"code": self.passcode}
        response = self.client.post(
            "/api/v1/device/auth",
            code,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["syncToken"], self.mobile_assignment.token)
        # since user has no forms assigned, formsUrl should be empty
        self.assertEqual(response.data["formsUrl"], [])

        # modify user access to super admin
        self.user_access.role = UserRoleTypes.super_admin
        self.user_access.save()

        response = self.client.post(
            "/api/v1/device/auth",
            code,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["syncToken"], self.mobile_assignment.token)
        # formsUrl should be all forms
        self.assertEqual(
            dict(response.data["formsUrl"][0]),
            {
                "id": self.forms[0].id,
                "version": str(self.forms[0].version),
                "url": f"/form/{self.forms[0].id}",
            },
        )

    def test_mobile_assignment_form_api_with_invalid_passcode(self):
        # wrong passcode
        code = {"code": "wrong code"}
        response = self.client.post(
            "/api/v1/device/auth",
            code,
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # response should be error
        self.assertEqual(response.json(), {"error": {"code": ["Invalid passcode"]}})

    def test_get_individual_forms_with_token(self):

        # get token
        code = {"code": self.passcode}
        auth = self.client.post(
            "/api/v1/device/auth",
            code,
            content_type="application/json",
        )
        token = auth.data["syncToken"]
        forms_url = auth.data["formsUrl"]

        self.assertEqual(auth.status_code, status.HTTP_200_OK)
        self.assertEqual(forms_url[0]["url"], f"/form/{self.forms[0].id}")

        form_url = forms_url[0]["url"]

        response = self.client.get(
            f"/api/v1/device{form_url}",
            follow=True,
            content_type="application/json",
            **{'HTTP_AUTHORIZATION': f'Bearer {token}'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            list(response.data),
            ["name", "version", "cascades", "question_group"]
        )
