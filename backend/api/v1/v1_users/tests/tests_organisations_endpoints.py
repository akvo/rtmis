from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings

from api.v1.v1_users.models import Organisation


@override_settings(USE_TZ=False)
class OrganisationEndpointsTestCase(TestCase):
    def setUp(self):
        call_command("fake_organisation_seeder", "--repeat", 5)

    def test_filter_organisations_by_attributes(self):
        data = self.client.get(
            '/api/v1/organisations?attributes=1',
            content_type='application/json'
        )
        self.assertEqual(data.status_code, 200)
        data = data.json()
        total = Organisation.objects.filter(
            organisation_organisation_attribute__type=1
        ).count()
        self.assertEqual(len(data), total)

    def test_filter_organisations_by_search(self):
        org = Organisation.objects.order_by('?').first()
        data = self.client.get(
            f"/api/v1/organisations?search={org.name[:3]}",
            content_type='application/json'
        )
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertGreater(len(data), 0)

    def test_get_children_by_organisation_attribute(self):
        data = self.client.get(
            '/api/v1/organisation/options/?attribute=2',
            content_type='application/json'
        )
        self.assertEqual(data.status_code, 200)
        data = data.json()
        total_children = Organisation.objects.filter(
            organisation_organisation_attribute__type=2
        ).count()
        self.assertEqual(len(data['children']), total_children)

    def test_get_empty_children_by_selected_organisation(self):
        data = self.client.get(
            '/api/v1/organisation/options/1?attribute=2',
            content_type='application/json'
        )
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(len(data['children']), 0)
