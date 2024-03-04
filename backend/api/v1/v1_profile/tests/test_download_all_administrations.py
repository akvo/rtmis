import os
from django.test import TestCase
from django.test.utils import override_settings
from django.core.management import call_command


@override_settings(USE_TZ=False)
class DownloadAllAdmTestCase(TestCase):
    def setUp(self) -> None:
        super().setUp()
        call_command("administration_seeder", "--test")

    def test_csv_generated(self):
        call_command("download_all_administrations", "--test")
        filename = "kenya-administration_test.csv"
        file_path = './storage/{0}'.format(filename)
        self.assertTrue(os.path.exists(file_path))
