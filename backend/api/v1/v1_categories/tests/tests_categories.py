import ast
import pandas as pd
from io import StringIO
from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from api.v1.v1_data.models import Answers, Questions


@override_settings(USE_TZ=False)
class CategoryTestCase(TestCase):
    def test_powerbi_endpoint(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post(
            "/api/v1/login", user_payload, content_type="application/json"
        )
        token = user_response.json().get("token")

        call_command("form_seeder", "--test")
        call_command("fake_data_seeder", "-r", 1, "-t", True)
        header = {"HTTP_AUTHORIZATION": f"Bearer {token}"}

        # PRIVATE RAW DATA ACCESS (POWER BI)
        data = self.client.get(
            "/api/v1/raw-data/1?page=1", follow=True, **header
        )
        self.assertEqual(data.status_code, 200)
        result = data.json()
        self.assertEqual(
            list(result["data"][0]),
            ["id", "name", "administration", "geo", "data", "categories"],
        )
        questions_queryset = Questions.objects.filter(form_id=1).values_list(
            "id", "name"
        )
        self.assertEqual(
            sorted(list(result["data"][0]["data"])),
            sorted([f"{str(x[0])}|{x[1]}" for x in list(questions_queryset)]),
        )

        # PRIVATE RAW DATA ACCESS (POWER BI) WITH FILTER
        question = Questions.objects.filter(form_id=1).first()
        data = self.client.get(
            f"/api/v1/raw-data/1?questions={question.id}&page=1",
            follow=True,
            **header,
        )
        self.assertEqual(data.status_code, 200)
        result = data.json()
        questions_queryset = Questions.objects.filter(
            form_id=1, pk=question.id
        ).values_list("id", "name")
        self.assertEqual(
            sorted(list(result["data"][0]["data"])),
            sorted([f"{str(x[0])}|{x[1]}" for x in list(questions_queryset)]),
        )

        # PRIVATE RAW DATA ACCESS (POWER BI PAGINATION)
        data = self.client.get(
            "/api/v1/raw-data/1?page=1", follow=True, **header
        )
        self.assertEqual(data.status_code, 200)
        result = data.json()
        self.assertEqual(
            sorted(list(result["data"][0])),
            sorted(
                ["id", "name", "administration", "geo", "data", "categories"]
            ),
        )

        # PRIVATE RAW DATA ACCESS WITHOUT HEADER TOKEN
        data = self.client.get("/api/v1/raw-data/1?page=1", follow=True)
        # TODO: AFTER DEMO, FIND HOW PROVIDE AUTHENTICATION IN POWERBI
        self.assertEqual(data.status_code, 200)

        # PRIVATE RAW DATA ACCESS (NO PAGINATED POWER BI)
        data = self.client.get("/api/v1/power-bi/1", follow=True, **header)
        self.assertEqual(data.status_code, 200)
        result = data.json()
        self.assertEqual(
            sorted(list(result[0])),
            sorted(
                ["id", "name", "administration", "geo", "data", "categories"]
            ),
        )

    def test_csv_endpoint(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        self.client.post(
            "/api/v1/login", user_payload, content_type="application/json"
        )
        call_command("form_seeder", "--test")
        call_command("fake_data_seeder", "-r", 1, "-t", True)

        # Call the function and get the response
        response = self.client.get("/api/v1/raw-data-csv/1", follow=True)

        # Verify the response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv")
        self.assertEqual(
            response["Content-Disposition"], 'attachment; filename="data.csv"'
        )

        # Test the generated CSV content
        csv_string = response.content.decode("utf-8")
        csv_content = StringIO(csv_string)
        df = pd.read_csv(csv_content, sep=",")
        for data_id in list(df["id"]):
            answers = Answers.objects.filter(data_id=data_id).all()
            row_value = df[df["id"] == data_id]
            for a in answers:
                csv_answer = row_value[f"{a.question.id}|{a.question.name}"][0]
                if csv_answer != csv_answer:
                    csv_answer = None
                db_answer = None
                if a.options:
                    db_answer = a.options
                    csv_answer = ast.literal_eval(csv_answer)
                if a.value:
                    db_answer = a.value
                if a.name:
                    db_answer = a.name
                self.assertEqual(db_answer, csv_answer)
        # ... Perform assertions on the CSV content
        # based on the expected values
