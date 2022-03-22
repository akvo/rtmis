import os
import uuid
from utils import storage
from django.test import TestCase, override_settings
from django.conf import settings


class StorageTestCase(TestCase):
    def test_upload(self):
        self.assertFalse(settings.FAKE_STORAGE)
        file_name = "test.txt"
        f = open("test.txt", "a")
        f.write("This is a test file!")
        f.close()
        uploaded_file = storage.upload(file=file_name, folder="test")
        self.assertTrue(storage.check(uploaded_file), "File not exists")
        self.assertEqual(uploaded_file, f"test/{file_name}")

    def test_download(self):
        self.assertFalse(settings.FAKE_STORAGE)
        file_name = "test.txt"
        f = open(file_name, "a")
        f.write("This is a test file!")
        f.close()
        uploaded_file = storage.upload(file=file_name, folder="test")
        self.assertEqual(uploaded_file, f"test/{file_name}")
        downloaded_file = storage.download(uploaded_file)
        self.assertEqual(downloaded_file, f"./tmp/{file_name}")
        self.assertTrue(os.path.exists(downloaded_file), "File not exists")
        os.remove(downloaded_file)


@override_settings(FAKE_STORAGE=True)
class DevStorageTestCase(TestCase):
    def test_dev_upload(self):
        self.assertTrue(settings.FAKE_STORAGE)
        hex = uuid.uuid4().hex
        file_name = f"test-{hex}.txt"
        f = open(file_name, "a")
        f.write("This is a test file!")
        f.close()
        uploaded_file = storage.upload(file=file_name, folder="test")
        self.assertTrue(os.path.exists(f"./tmp/fake_storage/{file_name}"),
                        "File not exists")
        self.assertTrue(storage.check(uploaded_file), "File not exists")
        self.assertEqual(uploaded_file, f"./tmp/fake_storage/{file_name}")
        os.remove(uploaded_file)
        os.remove(file_name)

    def test_dev_download(self):
        self.assertTrue(settings.FAKE_STORAGE)
        hex = uuid.uuid4().hex
        file_name = f"test-{hex}.txt"
        f = open(file_name, "a")
        f.write("This is a test file!")
        f.close()
        uploaded_file = storage.upload(file=file_name, folder="test")
        self.assertEqual(uploaded_file, f"./tmp/fake_storage/{file_name}")
        downloaded_file = storage.download(uploaded_file)
        self.assertEqual(downloaded_file, f"./tmp/fake_storage/{file_name}")
        self.assertTrue(os.path.exists(downloaded_file), "File not exists")
        os.remove(downloaded_file)
        os.remove(file_name)
