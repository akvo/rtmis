import os
from rtmis.settings import STORAGE_PATH
from django.test import TestCase
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.models import Administration, Access
from api.v1.v1_profile.constants import UserRoleTypes
from django.core.management import call_command
from api.v1.v1_mobile.models import MobileAssignment
from api.v1.v1_forms.models import Forms, UserForms
from utils import storage


def generate_file(filename: str):
    f = open(filename, "a")
    f.write("This is a test file!")
    f.close()
    return filename


class MobileAssignmentUploadImages(TestCase):
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
        self.form = Forms.objects.first()
        UserForms.objects.create(user=self.user, form=self.form)
        self.passcode = "passcode1234"
        MobileAssignment.objects.create_assignment(
            user=self.user, passcode=self.passcode
        )
        self.mobile_assignment = MobileAssignment.objects.get(user=self.user)
        self.token = self.mobile_assignment.token
        self.filename = generate_file(filename="test_image.jpg")

    # Delete Images after all finish
    def tearDown(self):
        os.remove(self.filename)

    def test_upload_image(self):
        response = self.client.post(
            "/api/v1/device/images",
            {"file": open(self.filename, "rb")},
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(list(response.json()), ["message", "file"])
        uploaded_filename = response.json().get("file")
        self.assertTrue(
            storage.check(uploaded_filename),
            "File exists",
        )
        os.remove(f"{STORAGE_PATH}/{uploaded_filename}")

    def test_upload_image_without_credentials(self):
        response = self.client.post(
            "/api/v1/device/images",
            {"file": open(self.filename, "rb")},
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json().get("detail"),
            "Authentication credentials were not provided.",
        )
