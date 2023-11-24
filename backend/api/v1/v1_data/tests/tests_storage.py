import os
import uuid
from utils import storage
from rtmis.settings import STORAGE_PATH
from django.test.utils import override_settings
from django.test import TestCase


def generate_file(filename: str, hex: bool = False):
    if hex:
        hex = uuid.uuid4().hex
        filename = f"{filename}-{hex}.txt"
    f = open(filename, "a")
    f.write("This is a test file!")
    f.close()
    return filename


@override_settings(USE_TZ=False)
class StorageTestCase(TestCase):
    def test_if_storage_path_exists(self):
        self.assertTrue(
            os.path.exists(STORAGE_PATH), "Storage path not exists"
        )

    def test_upload(self):
        filename = generate_file("test", hex=True)
        uploaded_file = storage.upload(file=filename, folder="test")
        self.assertTrue(
            os.path.exists(f"{STORAGE_PATH}/test/{filename}"),
            "File not exists"
        )
        self.assertTrue(storage.check(f"test/{filename}"), "File not exists")
        self.assertEqual(uploaded_file, f"{STORAGE_PATH}/test/{filename}")
        os.remove(filename)

    def test_upload_with_custom_filename(self):
        custom_filename = "custom-filename-test.txt"
        filename = generate_file("test")
        uploaded_file = storage.upload(
            file=filename, filename=custom_filename, folder="test"
        )
        self.assertEqual(
            uploaded_file, f"{STORAGE_PATH}/test/{custom_filename}"
        )
        self.assertTrue(
            storage.check(f"test/{custom_filename}"), "File not exists"
        )
        os.remove(filename)

    def test_download(self):
        filename = generate_file("test", hex=True)
        uploaded_file = storage.upload(file=filename, folder="test")
        self.assertEqual(uploaded_file, f"{STORAGE_PATH}/test/{filename}")
        downloaded_file = storage.download(f"test/{filename}")
        self.assertEqual(downloaded_file, uploaded_file)
        self.assertTrue(os.path.exists(downloaded_file), "File not exists")
        os.remove(downloaded_file)
        os.remove(filename)

    def test_check(self):
        filename = generate_file("test", hex=True)
        storage.upload(file=filename, folder="test")
        self.assertTrue(storage.check(f"test/{filename}"), "File not exists")
        os.remove(filename)

    def test_delete(self):
        filename = generate_file("test", hex=True)
        uploaded_file = storage.upload(file=filename, folder="test")
        self.assertTrue(os.path.exists(uploaded_file), "File not exists")
        deleted_file = storage.delete(f"test/{filename}")
        self.assertEqual(deleted_file, f"test/{filename}")
        self.assertFalse(os.path.exists(uploaded_file), "File exists")
        os.remove(filename)
