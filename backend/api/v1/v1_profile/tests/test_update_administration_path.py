import typing
from django.test import TestCase
from django.http import HttpResponse
from django.test.utils import override_settings
from api.v1.v1_profile.management.commands import administration_seeder
from api.v1.v1_profile.models import Administration


@override_settings(USE_TZ=False)
class UpdateAdministrationPathTestCase(TestCase):

    def setUp(self):
        super().setUp()
        county = [
            ["Jakarta/DKI Jakarta", "East Jakarta", "Kramat Djati", "Cawang"],
            ["Jakarta", "East-Jakarta", "Kramat Jati", "Balekambang"],
            ["Yogyakarta", "Sleman", "Seturan", "Cepit Baru"],
        ]
        administration_seeder.seed_administration_test(county=county)

        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post(
            "/api/v1/login", user_payload, content_type="application/json"
        )
        self.token = user_response.json().get("token")

    def test_update_parent_of_village(self):
        target = Administration.objects.filter(
            name="Cawang"
        ).first()
        correct_parent = Administration.objects.filter(
            name="Kramat Jati"
        ).first()
        payload = {
            'parent': correct_parent.id,
            'name': target.name,
        }

        response = typing.cast(
                HttpResponse,
                self.client.put(
                    f"/api/v1/administrations/{target.id}",
                    payload,
                    content_type='application/json',
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["name"], target.name)
        self.assertEqual(
            f"{correct_parent.path}{correct_parent.id}.",
            body["path"]
        )

    def test_update_parent_of_ward(self):
        target = Administration.objects.filter(
            name="Kramat Jati"
        ).first()
        correct_parent = Administration.objects.filter(
            name="East Jakarta"
        ).first()
        payload = {
            'parent': correct_parent.id,
            'name': target.name,
        }

        response = typing.cast(
                HttpResponse,
                self.client.put(
                    f"/api/v1/administrations/{target.id}",
                    payload,
                    content_type='application/json',
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["name"], target.name)
        self.assertEqual(
            f"{correct_parent.path}{correct_parent.id}.",
            body["path"]
        )
        for child in target.parent_administration.all():
            self.assertTrue(str(correct_parent.id) in child.path)

    def test_update_parent_of_subcounty(self):
        target = Administration.objects.filter(
            name="East Jakarta"
        ).first()
        correct_parent = Administration.objects.filter(
            name="Jakarta"
        ).first()
        payload = {
            'parent': correct_parent.id,
            'name': target.name,
        }

        response = typing.cast(
                HttpResponse,
                self.client.put(
                    f"/api/v1/administrations/{target.id}",
                    payload,
                    content_type='application/json',
                    HTTP_AUTHORIZATION=f'Bearer {self.token}'))

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["name"], target.name)

        current_path = f"{correct_parent.path}{correct_parent.id}."
        self.assertEqual(current_path, body["path"])

        villages_count = Administration.objects.filter(
            path__startswith=current_path,
            level__name="Village"
        ).count()
        self.assertEqual(villages_count, 2)
