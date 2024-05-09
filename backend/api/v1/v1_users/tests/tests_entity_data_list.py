from django.core.management import call_command
from django.test import TestCase
# from rest_framework_simplejwt.tokens import RefreshToken

from django.test.utils import override_settings
from api.v1.v1_profile.models import EntityData


@override_settings(USE_TZ=False)
class EntityDataListTestCase(TestCase):
    def setUp(self):
        call_command("administration_seeder", "--test")
        call_command("entities_seeder", "--test", True)

    def test_get_valid_entity_data(self):
        entity_data = EntityData.objects.filter(
            entity__name="School"
        ).order_by('?').first()
        entity_id = entity_data.entity.id
        adm_id = entity_data.administration.id
        res = self.client.get(f"/api/v1/entity-data/{entity_id}/list/{adm_id}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertNotEqual(len(data), 0)
        find_entity = list(filter(lambda x: x["id"] == entity_data.id, data))
        self.assertEqual(len(find_entity), 1)
        self.assertEqual(list(data[0]), ["id", "code", "name"])

    def test_get_invalid_entity_data(self):
        res = self.client.get("/api/v1/entity-data/x/list/y")
        self.assertEqual(res.status_code, 401)

    def test_got_empty_list_when_entity_data_doesnt_exists(self):
        res = self.client.get("/api/v1/entity-data/99/list/999")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data), 0)
