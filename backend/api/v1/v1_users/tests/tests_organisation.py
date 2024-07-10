from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings

from api.v1.v1_users.models import Organisation, OrganisationAttribute


@override_settings(USE_TZ=False)
class OrganisationTestCase(TestCase):
    def setUp(self):
        call_command("administration_seeder", "--test")

    def test_get_organisation(self):
        call_command("fake_organisation_seeder", "--repeat", 5)
        self.assertEqual(5, Organisation.objects.count())

        organisations = self.client.get('/api/v1/organisations',
                                        content_type='application/json')
        organisations = organisations.json()
        self.assertEqual(
                ["id", "name", "attributes", "users"],
                list(organisations[0]))
        self.assertEqual(["type_id", "name"],
                         list(organisations[0]["attributes"][0]))

    def test_get_details_organisation(self):
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post(
            '/api/v1/login',
            user_payload,
            content_type='application/json'
        )
        user = user_response.json()
        token = user.get('token')
        header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        req = self.client.post(
            '/api/v1/organisation',
            {"name": "Akvo", "attributes": [1]},
            content_type='application/json',
            **header
        )
        self.assertEqual(req.status_code, 200)

        org = Organisation.objects.order_by('?').first()
        res = self.client.get(
            f'/api/v1/organisation/{org.id}',
            content_type='application/json',
            **header
        )
        self.assertEqual(res.status_code, 200)

        res = res.json()
        self.assertEqual(org.id, res["id"])
        self.assertEqual(org.name, res["name"])

    def test_add_edit_delete_organisation(self):
        payload = {"name": "Test", "attributes": [1]}

        req = self.client.post('/api/v1/organisation',
                               payload,
                               content_type='application/json')
        self.assertEqual(req.status_code, 401)

        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        user = user_response.json()
        token = user.get('token')
        header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        req = self.client.post('/api/v1/organisation',
                               payload,
                               content_type='application/json',
                               **header)
        self.assertEqual(req.status_code, 200)
        organisation = Organisation.objects.first()
        attributes = OrganisationAttribute.objects.filter(
            organisation=organisation).count()
        self.assertEqual(attributes, 1)

        req = self.client.put(f'/api/v1/organisation/{organisation.id}',
                              payload)
        self.assertEqual(req.status_code, 401)

        payload.update({"attributes": [1, 2]})
        req = self.client.put(f'/api/v1/organisation/{organisation.id}',
                              payload,
                              content_type='application/json',
                              **header)
        attributes = OrganisationAttribute.objects.filter(
            organisation=organisation)
        self.assertEqual(attributes.count(), 2)

        payload.update({"attributes": [2]})
        req = self.client.put(f'/api/v1/organisation/{organisation.id}',
                              payload,
                              content_type='application/json',
                              **header)
        self.assertEqual(req.status_code, 200)
        attributes = OrganisationAttribute.objects.filter(
            organisation=organisation)
        self.assertEqual(attributes.count(), 1)
        self.assertEqual(attributes.first().type, 2)

        req = self.client.delete(f'/api/v1/organisation/{organisation.id}')
        self.assertEqual(req.status_code, 401)

        req = self.client.delete(f'/api/v1/organisation/{organisation.id}',
                                 **header)
        self.assertEqual(req.status_code, 204)
        self.assertEqual(Organisation.objects.count(), 0)
        self.assertEqual(OrganisationAttribute.objects.count(), 0)
