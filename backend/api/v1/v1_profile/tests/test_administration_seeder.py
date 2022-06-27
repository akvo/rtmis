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
        self.assertEqual(list(administrator_level), list(level_ids))
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
                "level": 0,
                "level_name": "National",
                "name": "Indonesia",
                "parent": None,
                "children": [{
                    "id": 2,
                    "name": "Jakarta",
                    "parent": 1
                }],
                "children_level_name": "County",
            }, response.json())
