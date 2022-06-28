import os
from pathlib import Path
from django.test import TestCase
from django.test.utils import override_settings

from api.v1.v1_profile.management.commands import administration_seeder

config_path = "source/config/config.min.js"


@override_settings(USE_TZ=False)
class ConfigJS(TestCase):
    def test_config_generation(self):
        administration_seeder.seed_administration_prod()
        os.remove(config_path)
        self.assertFalse(Path(config_path).exists())
        self.client.get("/api/v1/config.js", follow=True)
        self.assertTrue(Path(config_path).exists())
