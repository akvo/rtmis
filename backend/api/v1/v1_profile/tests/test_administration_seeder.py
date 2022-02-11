from django.test import TestCase

from api.v1.v1_profile.management.commands import administration_seeder
from api.v1.v1_profile.models import Levels, Administration


class AdministrationSeederTestCase(TestCase):

    def test_administration_seeder_production(self):
        administration_seeder.seed_administration_prod()
        administrator_level = Administration.objects.order_by(
            '-level').values_list('level', flat=True).distinct()
        level_ids = Levels.objects.order_by('-id').values_list('id', flat=True)
        self.assertEqual(list(administrator_level), list(level_ids))
        response = self.client.get("/api/v1/administration/1", follow=True)
        self.assertEqual(response.status_code, 200)
        response = response.json()
        self.assertEqual(response.get("id"), 1)
        self.assertEqual(response.get("name"), "Kenya")
        self.assertIsNone(response.get("parent"))
        self.assertIsNotNone(response.get("children"))

    def test_administration_seeder_test(self):
        administration_seeder.seed_administration_test()
        administrator_level = Administration.objects.order_by(
            '-level').values_list('level', flat=True).distinct()
        level_ids = Levels.objects.order_by('-id').values_list('id', flat=True)
        self.assertEqual(list(administrator_level), list(level_ids))
        response = self.client.get("/api/v1/administration/1", follow=True)
        self.assertEqual(response.status_code, 200)
        response = response.json()
        self.assertEqual(response.get("id"), 1)
        self.assertEqual(response.get("name"), "Indonesia")
        self.assertIsNone(response.get("parent"))
        self.assertIsNotNone(response.get("children"))
