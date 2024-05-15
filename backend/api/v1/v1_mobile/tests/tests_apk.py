import os
import requests_mock
import requests as r
from rtmis.settings import BASE_DIR, APP_NAME, MASTER_DATA, APK_UPLOAD_SECRET
from django.test import TestCase
from api.v1.v1_mobile.models import MobileApk


class MobileApkTestCase(TestCase):
    @classmethod
    def setUpClass(cls):
        # Get the path to the APK file and read its content
        file_path = os.path.join(BASE_DIR, "source", "testapp.apk")

        with open(file_path, "rb") as file:
            cls.apk_content = file.read()

        cls.mock = requests_mock.Mocker()
        cls.mock.start()

        # Mocking the GET request with the actual APK content
        cls.apk_url = (
            "https://expo.dev/artifacts/eas/dpRpygo9iviyK8k3oDUMzn.apk"
        )
        cls.mock.get(cls.apk_url, content=cls.apk_content)

        # Mocking the wrong URL with a 401 status code
        cls.wrong_apk_url = "http://example.com/wrong-url.apk"
        cls.mock.get(cls.wrong_apk_url, status_code=401)

        # Create the initial APK
        cls.apk_version = "1.0.0"
        cls.mobile_apk = MobileApk.objects.create(
            apk_url=cls.apk_url, apk_version=cls.apk_version
        )
        cls.apk_path = os.path.join(BASE_DIR, MASTER_DATA)

    @classmethod
    def tearDownClass(cls):
        os.remove(
            f"{cls.apk_path}/{APP_NAME}-{cls.mobile_apk.apk_version}.apk"
        )
        cls.mock.stop()

    def test_if_initial_apk_is_created(self):
        mobile_apk = MobileApk.objects.last()
        self.assertEqual(mobile_apk.apk_url, MobileApkTestCase.apk_url)
        self.assertEqual(mobile_apk.apk_version, self.apk_version)

    def test_if_apk_is_downloadable(self):
        request = r.get(MobileApkTestCase.apk_url)
        self.assertEqual(request.status_code, 200)

    def test_mobile_apk_download(self):
        # SUCCESS DOWNLOAD
        cls = MobileApkTestCase
        download = self.client.get("/api/v1/device/apk/download")
        self.assertEqual(download.status_code, 200)
        self.assertEqual(
            download["Content-Type"], "application/vnd.android.package-archive"
        )
        self.assertEqual(
            download["Content-Disposition"],
            (
                f"attachment; filename={APP_NAME}"
                f"-{cls.mobile_apk.apk_version}.apk"
            ),
        )
        self.assertTrue(download.has_header("Content-Length"))
        apk_file = (
            f"{cls.apk_path}/{APP_NAME}-{cls.mobile_apk.apk_version}.apk"
        )
        self.assertTrue(os.path.exists(apk_file))

    def test_mobile_apk_upload(self):
        # SUCCESS UPLOAD
        cls = MobileApkTestCase
        new_version = "1.0.1"
        upload = self.client.post(
            "/api/v1/device/apk/upload",
            {
                "apk_url": cls.apk_url,
                "apk_version": new_version,
                "secret": APK_UPLOAD_SECRET,
            },
        )
        self.assertEqual(upload.status_code, 201)
        new_file = f"{cls.apk_path}/{APP_NAME}-{new_version}.apk"
        self.assertTrue(os.path.exists(new_file))

        # NEW VERSION UPLOAD
        download = self.client.get("/api/v1/device/apk/download")
        self.assertEqual(download.status_code, 200)
        self.assertEqual(
            download["Content-Type"], "application/vnd.android.package-archive"
        )
        self.assertEqual(
            download["Content-Disposition"],
            f"attachment; filename={APP_NAME}-{new_version}.apk",
        )

        # FAILED UPLOAD WITH WRONG SECRET
        upload = self.client.post(
            "/api/v1/device/apk/upload",
            {
                "apk_url": cls.apk_url,
                "apk_version": "1.0.0",
                "secret": "WRONG_SECRET",
            },
        )
        self.assertEqual(upload.status_code, 400)
        self.assertEqual(upload.data["message"], "Secret is required.")

        # FAILED UPLOAD WITH WRONG APK URL
        upload = self.client.post(
            "/api/v1/device/apk/upload",
            {
                "apk_url": self.wrong_apk_url,
                "apk_version": "1.0.0",
                "secret": APK_UPLOAD_SECRET,
            },
        )
        self.assertEqual(upload.status_code, 404)

    def test_mobile_apk_check_version(self):
        # SUCCESS UPLOAD
        cls = MobileApkTestCase
        new_version = "1.0.1"
        upload = self.client.post(
            "/api/v1/device/apk/upload",
            {
                "apk_url": cls.apk_url,
                "apk_version": new_version,
                "secret": APK_UPLOAD_SECRET,
            },
        )
        self.assertEqual(upload.status_code, 201)
        new_file = f"{cls.apk_path}/{APP_NAME}-{new_version}.apk"
        self.assertTrue(os.path.exists(new_file))

        # check apk version with current version = last version
        check = self.client.get("/api/v1/device/apk/version/1.0.1")
        self.assertEqual(check.status_code, 404)

        # check apk version with current version > last version
        check = self.client.get("/api/v1/device/apk/version/1.0.2")
        self.assertEqual(check.status_code, 404)

        # check apk version with current version < last version
        check = self.client.get("/api/v1/device/apk/version/1.0.0")
        self.assertEqual(check.status_code, 200)
        self.assertEqual(check.json(), {"version": new_version})
