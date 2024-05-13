from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from api.v1.v1_data.models import FormData, Forms, Answers, AnswerHistory
from api.v1.v1_forms.constants import SubmissionTypes
from api.v1.v1_profile.models import (
    UserRoleTypes,
    Access,
    SystemUser,
    Administration,
)
from utils import storage
import json


@override_settings(USE_TZ=False)
class DataTestCase(TestCase):
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

    def test_list_form_data(self):
        user = SystemUser.objects.create_user(
            email="test@test.org",
            password="test1234",
            first_name="test",
            last_name="testing",
        )
        administration = Administration.objects.filter(level__level=1).first()
        role = UserRoleTypes.admin
        Access.objects.create(
            user=user, role=role, administration=administration
        )

        user_payload = {"email": "test@test.org", "password": "test1234"}

        user_response = self.client.post(
            "/api/v1/login", user_payload, content_type="application/json"
        )
        token = user_response.json().get("token")
        header = {"HTTP_AUTHORIZATION": f"Bearer {token}"}

        # PRIVATE ACCESS
        data = self.client.get(
            "/api/v1/form-data/1?submission_type=1&page=1&administration=1",
            content_type="application/json",
            **header,
        )
        result = data.json()
        self.assertEqual(data.status_code, 200)
        self.assertEqual(
            list(result), ["current", "total", "total_page", "data"]
        )
        self.assertEqual(
            list(result["data"][0]),
            [
                "id",
                "uuid",
                "name",
                "form",
                "administration",
                "geo",
                "created_by",
                "updated_by",
                "created",
                "updated",
                "pending_data",
                "submission_type",
            ],
        )
        self.assertIsNotNone(result["data"][0]["uuid"])

        # PUBLIC ACCESS WITHOUT HEADER TOKEN
        data = self.client.get(
            "/api/v1/form-data/1?page=1",
            content_type="application/json",
        )
        self.assertEqual(data.status_code, 401)

        # # EMPTY PAGE 2
        data = self.client.get("/api/v1/form-data/1?page=2", **header)
        self.assertEqual(data.status_code, 404)

    def test_datapoint_deletion(self):
        header = {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}

        # NOT FOUND
        exists = FormData.objects.filter(pk=1).first()
        if not exists:
            res = self.client.delete("/api/v1/data/1", follow=True, **header)
            self.assertEqual(res.status_code, 404)

        data_id = FormData.objects.first().id

        # REQUIRE AUTH
        res = self.client.delete("/api/v1/data/{data_id}")
        self.assertEqual(res.status_code, 404)

        res = self.client.delete(
            f"/api/v1/data/{data_id}", follow=True, **header
        )
        self.assertEqual(res.status_code, 204)
        answers = Answers.objects.filter(data_id=data_id).count()
        self.assertEqual(answers, 0)

    def test_datapoint_with_history_deletion(self):
        header = {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}

        # NOT FOUND
        exists = FormData.objects.filter(pk=1).first()
        if not exists:
            res = self.client.delete("/api/v1/data/1", follow=True, **header)
            self.assertEqual(res.status_code, 404)
        form = Forms.objects.first()
        self.assertEqual(form.id, 1)
        # Answer for UUID flag in question
        random_uuid = "xxxxx-xxxx-example-uuid"
        # Add data to edit
        payload = {
            "data": {
                "name": "Testing Data",
                "administration": 2,
                "geo": [6.2088, 106.8456],
                "submission_type": SubmissionTypes.registration,
            },
            "answer": [
                {"question": 101, "value": "Jane"},
                {"question": 102, "value": ["Male"]},
                {"question": 103, "value": 31208200175},
                {"question": 104, "value": 2},
                {"question": 105, "value": [6.2088, 106.8456]},
                {"question": 106, "value": ["Parent", "Children"]},
                {"question": 110, "value": random_uuid},
            ],
        }
        data = self.client.post(
            "/api/v1/form-data/1/",
            payload,
            content_type="application/json",
            **header,
        )
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data, {"message": "ok"})

        selected_data = FormData.objects.filter(
            form=form,
            uuid=random_uuid
        ).first()
        data_id = selected_data.id
        meta_uuid = selected_data.uuid

        # test if datapoint file is generated
        self.assertTrue(storage.check(f"datapoints/{meta_uuid}.json"))
        downloaded_json = storage.download(f"datapoints/{meta_uuid}.json")
        with open(downloaded_json, "r") as f:
            downloaded_json = json.load(f)

        # update data to test deletion with history
        self.assertEqual(meta_uuid, random_uuid)
        payload = [
            {"question": 101, "value": "Jane Doe"},
            {"question": 102, "value": ["Female"]},
        ]
        res = self.client.put(
            f"/api/v1/form-data/1?data_id={data_id}",
            payload,
            content_type="application/json",
            **header,
        )
        self.assertEqual(res.status_code, 200)
        res = res.json()
        self.assertEqual(res, {"message": "direct update success"})

        # Test if meta uuid is not changed
        new_meta_uuid = FormData.objects.get(pk=data_id).uuid
        self.assertEqual(new_meta_uuid, meta_uuid)

        # Test if downloaded json is updated
        new_downloaded_json = storage.download(f"datapoints/{meta_uuid}.json")
        with open(new_downloaded_json, "r") as f:
            new_downloaded_json = json.load(f)
        self.assertNotEqual(downloaded_json, new_downloaded_json)

        # Get answer from data with history
        res = self.client.get(
            f"/api/v1/data/{data_id}",
            content_type="application/json",
            **header,
        )
        self.assertEqual(res.status_code, 200)
        res = res.json()
        self.assertEqual(len(res) > 0, True)
        for d in res:
            question = d.get("question")
            value = d.get("value")
            history = d.get("history")
            if question == 101:
                self.assertEqual(question, 101)
                self.assertEqual(value, "Jane Doe")
                self.assertEqual(
                    list(history[0]), ["value", "created", "created_by"]
                )
                self.assertEqual(history[0]["created_by"], "Admin RUSH")
            if question == 102:
                self.assertEqual(question, 102)
                self.assertEqual(value, ["Female"])
                self.assertEqual(
                    list(history[0]), ["value", "created", "created_by"]
                )
                self.assertEqual(history[0]["created_by"], "Admin RUSH")
        # delete with history
        res = self.client.delete(
            f"/api/v1/data/{data_id}", follow=True, **header
        )
        self.assertEqual(res.status_code, 204)
        answers = Answers.objects.filter(data_id=data_id).count()
        self.assertEqual(answers, 0)
        hitory = AnswerHistory.objects.filter(data_id=data_id).count()
        self.assertEqual(hitory, 0)

    def test_monitoring_details_by_parent_id(self):
        header = {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}

        monitoring = FormData.objects.filter(parent__isnull=False).first()
        parent = monitoring.parent
        form_id = monitoring.form.id
        url = f"/api/v1/form-data/{form_id}?page=1&parent={parent.id}"
        data = self.client.get(url, follow=True, **header)
        result = data.json()
        self.assertEqual(data.status_code, 200)
        self.assertEqual(
            list(result), ["current", "total", "total_page", "data"]
        )
        # total equal to number of children + the data itself
        self.assertEqual(result["total"], parent.children.count() + 1)
        # make sure the last item is parent
        self.assertEqual(result["data"][-1]["name"], parent.name)
