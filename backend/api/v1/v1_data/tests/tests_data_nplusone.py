from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from api.v1.v1_data.models import FormData


@override_settings(USE_TZ=False)
class DataNPlusOneTestCase(TestCase):
    def setUp(self):
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")

        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post(
            "/api/v1/login", user_payload, content_type="application/json"
        )
        self.token = user_response.json().get("token")

        call_command("demo_approval_flow", "--test", True)
        call_command("fake_data_seeder", "-r", 1, "-t", True)
        call_command(
            "fake_data_monitoring_seeder", "-r", 5, "-t", True, "-a", True
        )

    def test_404_query(self):
        def call_route():
            header = {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}
            url = "/api/v1/form-data/100"
            url += "?submission_type=1&page=1&administration=1"
            self.client.get(
                url,
                content_type="application/json",
                **header,
            )
        self.assertNumQueries(4, call_route)

    def test_list_query(self):
        def call_route():
            header = {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}
            url = "/api/v1/form-data/1"
            url += "?submission_type=1&page=1&administration=1"
            self.client.get(
                url,
                content_type="application/json",
                **header,
            )
        self.assertNumQueries(19, call_route)

    def test_parent_query(self):
        def call_route():
            header = {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}
            parent = FormData.objects.filter(children__gt=0).first()
            pid = parent.id
            url = "/api/v1/form-data/1"
            url += f"?submission_type=2&page=1&parent=${pid}"
            self.client.get(
                url,
                content_type="application/json",
                **header,
            )
        self.assertNumQueries(5, call_route)
