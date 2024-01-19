import os
from rtmis.settings import STORAGE_PATH
from django.test import TestCase
from django.core.management import call_command
from utils import storage


def generate_image(filename: str, extension: str = "jpg"):
    filename = f"{filename}.{extension}"
    f = open(filename, "a")
    f.write("This is a test file!")
    f.close()
    return filename


class ImageUploadTest(TestCase):
    def setUp(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post(
            "/api/v1/login", user_payload, content_type="application/json"
        )
        self.token = user_response.json().get("token")

    def test_image_upload(self):
        filename = generate_image(filename="test", extension="png")
        response = self.client.post(
            "/api/v1/upload/images/",
            {"file": open(filename, "rb")},
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(list(response.json()), ["message", "file"])
        uploaded_filename = response.json().get("file")
        uploaded_filename = uploaded_filename.split("/")[-1]
        self.assertTrue(
            storage.check(f"/images/{uploaded_filename}"),
            "File exists",
        )
        os.remove(f"{STORAGE_PATH}/images/{uploaded_filename}")
        os.remove(filename)

    def test_wrong_extension_upload(self):
        filename = generate_image(filename="test", extension="txt")
        response = self.client.post(
            "/api/v1/upload/images/",
            {"file": open(filename, "rb")},
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            "File extension “txt” is not allowed. Allowed extensions are: jpg, png, jpeg.",  # noqa
        )
        os.remove(filename)
