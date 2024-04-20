from django.test import TestCase
from django.test.utils import override_settings

from api.v1.v1_profile.management.commands import administration_seeder
from api.v1.v1_profile.models import Levels, Administration
from api.v1.v1_users.serializers import ListAdministrationChildrenSerializer


@override_settings(USE_TZ=False)
class AdministrationSeederTestCase(TestCase):
    def test_administration_seeder_production(self):
        administration_seeder.seed_administration_prod()
        administrator_level = Administration.objects.order_by(
            '-level').values_list('level', flat=True).distinct()
        level_ids = Levels.objects.order_by('-id').values_list('id', flat=True)
        self.assertTrue(set(administrator_level).issubset(set(level_ids)))
        children = Administration.objects.filter(level__level=1).all()
        children = ListAdministrationChildrenSerializer(instance=children,
                                                        many=True)
        response = self.client.get("/api/v1/administration/1", follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {
                "id": 1,
                "level": 0,
                "level_name": "National",
                "name": "Kenya",
                "parent": None,
                "children": children.data,
                "children_level_name": "County",
                "full_name": "Kenya",
                "path": None
            }, response.json())

    def test_administration_seeder_test(self):
        administration_seeder.seed_administration_test()
        administrator_level = Administration.objects.order_by(
            '-level').values_list('level', flat=True).distinct()
        level_ids = Levels.objects.order_by('-id').values_list('id', flat=True)
        self.assertEqual(list(administrator_level), list(level_ids))
        response = self.client.get('/api/v1/administration/1', follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {
                "id": 1,
                "full_name": "Indonesia",
                "path": None,
                "parent": None,
                "name": "Indonesia",
                "level_name": "National",
                "level": 0,
                "children": [
                    {
                        "id": 2,
                        "parent": 1,
                        "path": "1.",
                        "level": 2,
                        "name": "Jakarta",
                        "full_name": "Indonesia|Jakarta"
                    },
                    {
                        "id": 6,
                        "parent": 1,
                        "path": "1.",
                        "level": 2,
                        "name": "Yogyakarta",
                        "full_name": "Indonesia|Yogyakarta"
                    }
                ],
                "children_level_name": "County"
            }, response.json())

        # Test max_level
        response = self.client.get('/api/v1/administration/1?max_level=0',
                                   follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {
                "id": 1,
                "path": None,
                "level": 0,
                "level_name": "National",
                "name": "Indonesia",
                "full_name": "Indonesia",
                "parent": None,
                "children": [],
                "children_level_name": "County",
            }, response.json())

        # tests filter
        response = self.client.get('/api/v1/administration/1?filter=2',
                                   follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {
                "id": 1,
                "path": None,
                "level": 0,
                "level_name": "National",
                "name": "Indonesia",
                "full_name": "Indonesia",
                "parent": None,
                "children": [{
                    "id": 2,
                    "level": 2,
                    "name": "Jakarta",
                    "full_name": "Indonesia|Jakarta",
                    "parent": 1,
                    "path": "1."
                }],
                "children_level_name": "County",
            }, response.json())
