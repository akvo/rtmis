from django.test import TestCase
from api.v1.v1_profile.models import Levels
from api.v1.v1_forms.models import Forms
from api.v1.v1_data.models import SubmissionTypes
from api.v1.v1_users.models import SystemUser
from django.core.management import call_command
from rest_framework import status


class MobileAssignmentApiSyncEmptyPayloadTest(TestCase):
    def setUp(self):
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")
        call_command("demo_approval_flow", "--test", True)

        ward_level = Levels.objects.order_by('-level')[1:2].first()
        self.form = Forms.objects.get(pk=1)
        user = SystemUser.objects.filter(
            user_access__administration__level=ward_level,
            mobile_assignments__forms=self.form
        ).first()
        self.mobile_user = user.mobile_assignments.first()

        res = self.client.post(
            "/api/v1/device/auth",
            {"code": "secr3tc0de"},
            content_type="application/json",
        )
        data = res.json()
        self.token = data["syncToken"]

    def test_empty_required_text_and_options_payload(self):
        mobile_adm = self.mobile_user.administrations.first()
        payload = {
            "formId": self.form.id,
            "name": "datapoint #1",
            "duration": 1,
            "submittedAt": "2024-04-29T02:38:13.807Z",
            "submitter": self.mobile_user.name,
            "geo": [6.2088, 106.8456],
            "submission_type": SubmissionTypes.registration,
            "answers": {
                101: "",
                102: None,
                103: 62723817,
                104: mobile_adm.id,
                105: [6.2088, 106.8456],
                106: [],
                107: "photo.jpeg",
                108: "2024-04-29",
                109: 0.6,
                110: "72b9ecb2-c400-4b76-bcba-0a70a6942bb6",
            }
        }
        response = self.client.post(
            "/api/v1/device/sync",
            payload,
            follow=True,
            content_type="application/json",
            **{"HTTP_AUTHORIZATION": f"Bearer {self.token}"},
        )
        data = response.json()
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("101", data["message"])
        self.assertIn("value may not be null.", data["message"])
        self.assertIn("106", data["message"])

    def test_empty_non_required_autofield_payload(self):
        mobile_adm = self.mobile_user.administrations.first()
        payload = {
            "formId": self.form.id,
            "name": "datapoint #1",
            "duration": 1,
            "submittedAt": "2024-04-29T02:38:13.807Z",
            "submitter": self.mobile_user.name,
            "geo": [6.2088, 106.8456],
            "submission_type": SubmissionTypes.registration,
            "answers": {
                101: "A",
                102: ["male"],
                103: 62723817,
                104: mobile_adm.id,
                105: [6.2088, 106.8456],
                106: ["wife__husband__partner"],
                107: "photo.jpeg",
                108: "2024-04-29",
                109: 0.6,
                110: "72b9ecb2-c400-4b76-bcba-0a70a6942bb6",
                111: ""
            }
        }
        response = self.client.post(
            "/api/v1/device/sync",
            payload,
            follow=True,
            content_type="application/json",
            **{"HTTP_AUTHORIZATION": f"Bearer {self.token}"},
        )
        data = response.json()
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(data["message"], "Value is required for Question:111")
