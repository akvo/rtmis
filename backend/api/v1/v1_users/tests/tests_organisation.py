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
        self.assertEqual(["id", "name", "attributes"], list(organisations[0]))
        self.assertEqual(["type_id", "name"],
                         list(organisations[0]["attributes"][0]))

    def test_add_edit_delete_organisation(self):
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        user = user_response.json()
        token = user.get('token')
        header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        payload = {"name": "Test", "attributes": [1]}
        req = self.client.post('/api/v1/organisation',
                               payload,
                               content_type='application/json',
                               **header)
        self.assertEqual(req.status_code, 200)
        call_command("fake_organisation_seeder", "--repeat", 5)

        payload.update({"attributes": [1, 2]})
        req = self.client.put('/api/v1/organisation/1',
                              payload,
                              content_type='application/json',
                              **header)

        payload.update({"attributes": [2]})
        req = self.client.put('/api/v1/organisation/1',
                              payload,
                              content_type='application/json',
                              **header)
        self.assertEqual(req.status_code, 200)
