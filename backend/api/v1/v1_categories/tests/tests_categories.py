import ast
import pandas as pd
from io import StringIO
from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from api.v1.v1_data.models import Answers, Questions
from api.v1.v1_categories.functions import validate_number, get_valid_list
from api.v1.v1_categories.models import DataCategory
from api.v1.v1_data.models import FormData


@override_settings(USE_TZ=False)
class CategoryTestCase(TestCase):
    def setUp(self):
        super().setUp()
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post(
            "/api/v1/login", user_payload, content_type="application/json"
        )
        token = user_response.json().get("token")

        call_command("form_seeder", "--test")
        call_command("demo_approval_flow", "--test", True)
        call_command("fake_data_seeder", "-r", 1, "-t", True)
        self.header = {"HTTP_AUTHORIZATION": f"Bearer {token}"}

        call_command(
            "generate_views", "-f", "./source/config/category-example.json"
        )

    def tearDown(self):
        super().tearDown()
        call_command("generate_views")

    def test_data_category_serialization(self):
        category = DataCategory.objects.first()
        self.assertEqual(
            list(category.serialize), ["id", "name", "data", "form", "opt"]
        )

    def test_powerbi_endpoint(self):
        header = self.header
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
        datapoint = FormData.objects.get(pk=result["data"][0]['id'])
        questions = [
            "{0}|{1}".format(
                a.question.id,
                a.question.name
            )
            for a in datapoint.data_answer.all()
        ]
        self.assertEqual(
            sorted(list(result["data"][0]["data"])),
            sorted(questions),
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
                csv_answer = row_value[f"{a.question.id}|{a.question.name}"]\
                    .item()
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

    def test_validate_number(self):
        answer = [10]
        opt1 = {"number": {"greater_than": 0}}
        res1 = validate_number(q=opt1, answer=answer)
        self.assertTrue(res1)

        opt2 = {"number": {"less_than": 11}}
        res2 = validate_number(q=opt2, answer=answer)
        assert res2 is True
        self.assertTrue(res2)

        opt3 = {"number": {"equal": 10}}
        res3 = validate_number(q=opt3, answer=answer)
        self.assertTrue(res3)

        opt4 = {"number": {"greater_than_equal": 10}}
        res4 = validate_number(q=opt4, answer=answer)
        self.assertTrue(res4)

        opt5 = {"number": {"less_than_equal": 10}}
        res5 = validate_number(q=opt5, answer=answer)
        self.assertTrue(res5)

    def test_get_valid_list_with_else_has_ignore_and_name(self):
        opt = {"567820002": ["Yes"], "567800083": ["No"], "567800080": [1]}
        c = {
            "name": "Basic",
            "questions": [
                {
                    "id": 567820002,
                    "name": "Toilet Available?",
                    "options": ["Yes"],
                    "else": {
                        "name": "No Service",
                        "ignore": [567800083, 567800080],
                    },
                },
                {
                    "id": 567800083,
                    "name": "Share with outside member?",
                    "options": ["No"],
                    "else": {"name": "Limited"},
                },
                {
                    "id": 567800080,
                    "name": "Usable Toilet",
                    "number": {"greater_than": 0},
                    "else": {"name": "Limited"},
                },
            ],
        }
        category = False
        res1 = get_valid_list(opt, c, category)
        self.assertEqual(res1, "Basic")

        opt = {"567820002": ["Yes"], "567800083": ["Yes"], "567800080": [1]}
        res2 = get_valid_list(opt, c, category)
        self.assertEqual(res2, "Limited")

        opt = {"567820002": ["Yes"], "567800083": ["No"], "567800080": [0]}
        res3 = get_valid_list(opt, c, category)
        self.assertEqual(res3, "Limited")

        opt = {"567820002": ["No"]}
        res4 = get_valid_list(opt, c, category)
        self.assertEqual(res4, "No Service")

    def test_get_valid_list_with_else_has_ignore_only(self):
        opt = {"578820191": ["Co-education"], "567800081": ["Yes"]}
        category = False
        c_school = {
            "name": "Basic",
            "questions": [
                {
                    "id": 578820191,
                    "name": "Is the school co-ed",
                    "options": ["Co-education"],
                    "else": {"ignore": [567800081]},
                },
                {
                    "id": 567800081,
                    "name": "Saperate Toilet",
                    "options": ["Yes"],
                    "else": {"name": "Limited"},
                },
            ],
        }
        res = get_valid_list(opt=opt, c=c_school, category=category)
        self.assertEqual(res, "Basic")

        opt2 = {"578820191": ["Co-education"], "567800081": ["No"]}
        res2 = get_valid_list(opt=opt2, c=c_school, category=category)
        self.assertEqual(res2, "Limited")

        opt3 = {"578820191": ["Girls only"]}
        res3 = get_valid_list(opt=opt3, c=c_school, category=category)
        self.assertEqual(res3, "Basic")

    def test_get_valid_list_with_other(self):
        opt = {"573340127": ["Protected dug well"]}
        category = False
        c = {
            "name": "Basic",
            "questions": [
                {
                    "id": 573340127,
                    "name": "Main Source",
                    "options": [
                        "Protected dug well",
                        "Public tap/standpipe",
                        "Piped to neighbour",
                    ],
                    "other": [
                        {
                            "name": "Surface Water",
                            "options": ["Surface water"],
                            "questions": [],
                        }
                    ],
                    "else": {"name": "Unimproved"},
                },
            ],
        }
        res = get_valid_list(opt, c, category)
        self.assertEqual(res, "Basic")

        opt = {"573340127": ["Surface water"]}
        res2 = get_valid_list(opt, c, category)
        self.assertEqual(res2, "Surface Water")

        opt = {"573340127": ["No water source"]}
        res3 = get_valid_list(opt, c, category)
        self.assertEqual(res3, "Unimproved")

    def test_get_valid_list_without_other_and_else(self):
        opt = {"573340127": ["Rainwater"]}
        category = False
        c = {
            "name": "Basic",
            "questions": [
                {
                    "id": 573340127,
                    "name": "Main Source",
                    "options": [
                        "Protected dug well",
                        "Public tap/standpipe",
                        "Piped to neighbour",
                    ],
                },
            ],
        }
        res = get_valid_list(opt, c, category)
        self.assertFalse(res)
