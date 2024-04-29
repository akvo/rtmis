from django.test import TestCase
from api.v1.v1_profile.models import Levels
from api.v1.v1_forms.models import Forms
from api.v1.v1_data.models import SubmissionTypes
from api.v1.v1_users.models import SystemUser
from api.v1.v1_data.models import PendingAnswers, PendingFormData
from django.core.management import call_command
from rest_framework import status


class MobileAssignmentApiSyncEmptyPayloadTest(TestCase):
    def setUp(self):
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")
        call_command("demo_approval_flow", "--test", True)

        ward_level = Levels.objects.order_by("-level")[1:2].first()
        self.form = Forms.objects.get(pk=1)
        user = SystemUser.objects.filter(
            user_access__administration__level=ward_level,
            mobile_assignments__forms=self.form,
        ).first()
        self.mobile_user = user.mobile_assignments.first()

        res = self.client.post(
            "/api/v1/device/auth",
            {"code": "secr3tc0de"},
            content_type="application/json",
        )
        data = res.json()
        self.token = data["syncToken"]

    def test_empty_required_text_type_of_question(self):
        mobile_adm = self.mobile_user.administrations.first()
        uuid = "12b9ecb2-c400-4b76-bcba-0a70a6942bb6"
        st = SubmissionTypes.registration
        payload = {
            "formId": self.form.id,
            "name": "datapoint #1",
            "duration": 1,
            "submittedAt": "2024-04-29T02:38:13.807Z",
            "submitter": self.mobile_user.name,
            "geo": [6.2088, 106.8456],
            "submission_type": st,
            "answers": {
                102: ["female"],
                103: 62723817,
                104: mobile_adm.id,
                105: [6.2088, 106.8456],
                106: ["wife__husband__partner"],
                107: "photo.jpeg",
                108: "2024-04-29",
                109: 0.6,
                110: uuid,
            },
        }
        response = self.client.post(
            "/api/v1/device/sync",
            payload,
            follow=True,
            content_type="application/json",
            **{"HTTP_AUTHORIZATION": f"Bearer {self.token}"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pending_data = PendingFormData.objects.filter(
            submission_type=st,
            uuid=uuid
        ).first()
        self.assertTrue(pending_data.id)

        a_101 = PendingAnswers.objects.filter(
            question_id=101,
            pending_data_id=pending_data.id
        ).first()
        self.assertFalse(a_101)

    def test_empty_required_number_type_of_question(self):
        mobile_adm = self.mobile_user.administrations.first()
        uuid = "22b9ecb2-c400-4b76-bcba-0a70a6942bb6"
        st = SubmissionTypes.registration
        payload = {
            "formId": self.form.id,
            "name": "datapoint #1",
            "duration": 1,
            "submittedAt": "2024-04-29T02:38:13.807Z",
            "submitter": self.mobile_user.name,
            "geo": [6.2088, 106.8456],
            "submission_type": st,
            "answers": {
                101: "John Doe",
                102: ["male"],
                103: 62723817,
                104: mobile_adm.id,
                105: [6.2088, 106.8456],
                106: ["wife__husband__partner"],
                107: "photo.jpeg",
                108: "2024-04-29",
                110: uuid,
            },
        }
        response = self.client.post(
            "/api/v1/device/sync",
            payload,
            follow=True,
            content_type="application/json",
            **{"HTTP_AUTHORIZATION": f"Bearer {self.token}"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pending_data = PendingFormData.objects.filter(
            submission_type=st,
            uuid=uuid
        ).first()
        self.assertTrue(pending_data.id)

        a_109 = PendingAnswers.objects.filter(
            question_id=109,
            pending_data_id=pending_data.id
        ).first()
        self.assertFalse(a_109)

    def test_allowed_zero_required_number_type_of_question(self):
        mobile_adm = self.mobile_user.administrations.first()
        uuid = "32b9ecb2-c400-4b76-bcba-0a70a6942bb6"
        st = SubmissionTypes.registration
        payload = {
            "formId": self.form.id,
            "name": "datapoint #1",
            "duration": 1,
            "submittedAt": "2024-04-29T02:38:13.807Z",
            "submitter": self.mobile_user.name,
            "geo": [6.2088, 106.8456],
            "submission_type": st,
            "answers": {
                101: "Jane Doe",
                102: ["female"],
                103: 62723817,
                104: mobile_adm.id,
                105: [6.2088, 106.8456],
                106: ["wife__husband__partner"],
                107: "photo.jpeg",
                108: "2024-04-29",
                109: 0,
                110: uuid,
            },
        }
        response = self.client.post(
            "/api/v1/device/sync",
            payload,
            follow=True,
            content_type="application/json",
            **{"HTTP_AUTHORIZATION": f"Bearer {self.token}"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pending_data = PendingFormData.objects.filter(
            submission_type=st,
            uuid=uuid
        ).first()
        self.assertTrue(pending_data.id)

        a_109 = PendingAnswers.objects.filter(
            question_id=109,
            pending_data_id=pending_data.id
        ).first()
        self.assertTrue(a_109)
        self.assertEqual(a_109.value, 0)

    def test_empty_required_option_type_of_question(self):
        mobile_adm = self.mobile_user.administrations.first()
        uuid = "42b9ecb2-c400-4b76-bcba-0a70a6942bb6"
        st = SubmissionTypes.registration
        payload = {
            "formId": self.form.id,
            "name": "datapoint #1",
            "duration": 1,
            "submittedAt": "2024-04-29T02:38:13.807Z",
            "submitter": self.mobile_user.name,
            "geo": [6.2088, 106.8456],
            "submission_type": st,
            "answers": {
                101: "John Doe",
                103: 62723817,
                104: mobile_adm.id,
                105: [6.2088, 106.8456],
                107: "photo.jpeg",
                108: "2024-04-29",
                109: 0.6,
                110: uuid,
            },
        }
        response = self.client.post(
            "/api/v1/device/sync",
            payload,
            follow=True,
            content_type="application/json",
            **{"HTTP_AUTHORIZATION": f"Bearer {self.token}"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pending_data = PendingFormData.objects.filter(
            submission_type=st,
            uuid=uuid
        ).first()
        self.assertTrue(pending_data.id)

        a_102 = PendingAnswers.objects.filter(
            question_id=102,
            pending_data_id=pending_data.id
        ).first()
        self.assertFalse(a_102)

    def test_empty_required_multiple_options_type_of_question(self):
        mobile_adm = self.mobile_user.administrations.first()
        uuid = "52b9ecb2-c400-4b76-bcba-0a70a6942bb6"
        st = SubmissionTypes.registration
        payload = {
            "formId": self.form.id,
            "name": "datapoint #1",
            "duration": 1,
            "submittedAt": "2024-04-29T02:38:13.807Z",
            "submitter": self.mobile_user.name,
            "geo": [6.2088, 106.8456],
            "submission_type": st,
            "answers": {
                101: "John Doe",
                102: ["male"],
                103: 62723817,
                104: mobile_adm.id,
                105: [6.2088, 106.8456],
                107: "photo.jpeg",
                108: "2024-04-29",
                109: 0.6,
                110: uuid,
            },
        }
        response = self.client.post(
            "/api/v1/device/sync",
            payload,
            follow=True,
            content_type="application/json",
            **{"HTTP_AUTHORIZATION": f"Bearer {self.token}"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pending_data = PendingFormData.objects.filter(
            submission_type=st,
            uuid=uuid
        ).first()
        self.assertTrue(pending_data.id)
        a_106 = PendingAnswers.objects.filter(
            question_id=106,
            pending_data_id=pending_data.id
        ).first()
        self.assertFalse(a_106)

    def test_empty_required_geo_type_of_question(self):
        mobile_adm = self.mobile_user.administrations.first()
        uuid = "62b9ecb2-c400-4b76-bcba-0a70a6942bb6"
        st = SubmissionTypes.registration
        payload = {
            "formId": self.form.id,
            "name": "datapoint #1",
            "duration": 1,
            "submittedAt": "2024-04-29T02:38:13.807Z",
            "submitter": self.mobile_user.name,
            "geo": [6.2088, 106.8456],
            "submission_type": st,
            "answers": {
                101: "John Doe",
                102: ["male"],
                103: 62723817,
                104: mobile_adm.id,
                106: ["children"],
                107: "photo.jpeg",
                108: "2024-04-29",
                109: 0.6,
                110: uuid,
            },
        }
        response = self.client.post(
            "/api/v1/device/sync",
            payload,
            follow=True,
            content_type="application/json",
            **{"HTTP_AUTHORIZATION": f"Bearer {self.token}"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pending_data = PendingFormData.objects.filter(
            submission_type=st,
            uuid=uuid
        ).first()
        self.assertTrue(pending_data.id)
        a_105 = PendingAnswers.objects.filter(
            question_id=105,
            pending_data_id=pending_data.id
        ).first()
        self.assertFalse(a_105)

    def test_empty_required_hidden_from_registration_type(self):
        mobile_adm = self.mobile_user.administrations.first()
        uuid = "72b9ecb2-c400-4b76-bcba-0a70a6942bb6"
        st = SubmissionTypes.registration
        payload = {
            "formId": self.form.id,
            "name": "datapoint #1",
            "duration": 1,
            "submittedAt": "2024-04-29T02:38:13.807Z",
            "submitter": self.mobile_user.name,
            "geo": [6.2088, 106.8456],
            "submission_type": st,
            "answers": {
                101: "Jane Doe",
                102: ["fale"],
                103: 62723817,
                104: mobile_adm.id,
                105: [6.2088, 106.8456],
                106: ["children"],
                107: "photo.jpeg",
                108: "2024-04-29",
                109: 0.6,
                110: uuid,
                111: "12"
            },
        }
        response = self.client.post(
            "/api/v1/device/sync",
            payload,
            follow=True,
            content_type="application/json",
            **{"HTTP_AUTHORIZATION": f"Bearer {self.token}"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pending_data = PendingFormData.objects.filter(
            submission_type=st,
            uuid=uuid
        ).first()
        self.assertTrue(pending_data.id)
        a_112 = PendingAnswers.objects.filter(
            question_id=112,
            pending_data_id=pending_data.id
        ).first()
        self.assertFalse(a_112)

    def test_empty_non_required_autofield_type_of_question(self):
        mobile_adm = self.mobile_user.administrations.first()
        uuid = "82b9ecb2-c400-4b76-bcba-0a70a6942bb6"
        st = SubmissionTypes.registration
        payload = {
            "formId": self.form.id,
            "name": "datapoint #1",
            "duration": 1,
            "submittedAt": "2024-04-29T02:38:13.807Z",
            "submitter": self.mobile_user.name,
            "geo": [6.2088, 106.8456],
            "submission_type": st,
            "answers": {
                101: "John",
                102: ["male"],
                103: 62723817,
                104: mobile_adm.id,
                105: [6.2088, 106.8456],
                106: ["wife__husband__partner"],
                107: "photo.jpeg",
                108: "2024-04-29",
                109: 0.6,
                110: uuid,
            },
        }
        response = self.client.post(
            "/api/v1/device/sync",
            payload,
            follow=True,
            content_type="application/json",
            **{"HTTP_AUTHORIZATION": f"Bearer {self.token}"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pending_data = PendingFormData.objects.filter(
            submission_type=st,
            uuid=uuid
        ).first()
        self.assertTrue(pending_data.id)
        a_111 = PendingAnswers.objects.filter(
            question_id=111,
            pending_data_id=pending_data.id
        ).first()
        self.assertFalse(a_111)

    def test_empty_required_meta_uuid_type_of_question(self):
        mobile_adm = self.mobile_user.administrations.first()
        st = SubmissionTypes.registration
        payload = {
            "formId": self.form.id,
            "name": "datapoint #1",
            "duration": 1,
            "submittedAt": "2024-04-29T02:38:13.807Z",
            "submitter": self.mobile_user.name,
            "geo": [6.2088, 106.8456],
            "submission_type": st,
            "answers": {
                101: "John non uuid",
                102: ["male"],
                103: 62723817,
                104: mobile_adm.id,
                105: [6.2088, 106.8456],
                106: ["wife__husband__partner"],
                107: "photo.jpeg",
                108: "2024-04-29",
                109: 0.6,
            },
        }
        response = self.client.post(
            "/api/v1/device/sync",
            payload,
            follow=True,
            content_type="application/json",
            **{"HTTP_AUTHORIZATION": f"Bearer {self.token}"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pending_data = PendingFormData.objects.filter(
            submission_type=st,
            pending_data_answer__name="John non uuid"
        ).first()
        self.assertTrue(pending_data.id)
        self.assertTrue(pending_data.uuid)
        a_110 = PendingAnswers.objects.filter(
            question_id=110,
            pending_data_id=pending_data.id
        ).first()
        self.assertFalse(a_110)
