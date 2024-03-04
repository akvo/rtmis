from django.test import TestCase
from django.test.utils import override_settings
from django.core.management import call_command


@override_settings(USE_TZ=False)
class AdministrationCSVTestCase(TestCase):
    def setUp(self) -> None:
        super().setUp()
        call_command("administration_seeder", "--test")
        call_command("download_all_administrations", "--test")

    def test_add_data_in_csv(self):
        # TODO
        self.assertTrue(True)

    def test_update_data_in_csv(self):
        # TODO
        self.assertTrue(True)

    def test_delete_data_in_csv(self):
        # TODO
        self.assertTrue(True)
