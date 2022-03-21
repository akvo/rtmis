import os
from utils import storage
from django.test import TestCase


class StorageTestCase(TestCase):
    def test_upload(self):
        file_path = "test.txt"
        f = open(file_path, "a")
        f.write("This is a test file!")
        f.close()
        uploaded_file = storage.upload(file=file_path, folder="test")
        self.assertTrue(storage.check(uploaded_file), "File not exists")
        self.assertEqual(uploaded_file, "test/test.txt")

    def test_download(self):
        file_path = "test.txt"
        f = open(file_path, "a")
        f.write("This is a test file!")
        f.close()
        uploaded_file = storage.upload(file=file_path, folder="test")
        self.assertEqual(uploaded_file, "test/test.txt")
        downloaded_file = storage.download(uploaded_file)
        self.assertEqual(downloaded_file, "./tmp/test.txt")
        self.assertTrue(os.path.exists(downloaded_file), "File not exists")
        os.remove(downloaded_file)
