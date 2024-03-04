from io import StringIO

from django.test import TestCase
from django.test.utils import override_settings
from django.core.management import call_command


@override_settings(USE_TZ=False)
class DownloadAllAdmTestCase(TestCase):
    def setUp(self) -> None:
        super().setUp()
        call_command("administration_seeder", "--test")

    def call_command(self, *args, **kwargs):
        out = StringIO()
        call_command(
            "download_all_administrations",
            "--test",
            *args,
            stdout=out,
            stderr=StringIO(),
            **kwargs,
        )
        return out.getvalue()

    def test_csv_generated(self):
        output = self.call_command()
        text = "File Created: ./storage/kenya-administration_test.csv"
        self.assertTrue(output, text)
