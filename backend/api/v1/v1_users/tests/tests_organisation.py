from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings

from api.v1.v1_users.models import Organisation


@override_settings(USE_TZ=False)
class OrganisationTestCase(TestCase):
    def test_get_organisation(self):
        call_command("fake_organisation_seeder", "--repeat", 5)
        self.assertEqual(5, Organisation.objects.count())

        organisations = self.client.get('/api/v1/organisations',
                                        content_type='application/json')
        organisations = organisations.json()
        self.assertEqual(
            {
                "id":
                1,
                "name":
                "Akvo",
                "attributes": [
                    {
                        "type_id": 1,
                        "name": "member"
                    },
                    {
                        "type_id": 2,
                        "name": "partnership"
                    },
                ]
            }, organisations[0])
