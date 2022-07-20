from django.test import TestCase
from django.test.utils import override_settings


@override_settings(USE_TZ=False)
class FeedbackTestCase(TestCase):
    def test_send_feedback(self):
        payload = {
            "name": "Test Feedback",
            "email": "admin@rush.com",
            "message": "This is message."
        }
        feedback = self.client.post(
            '/api/v1/feedback',
            payload,
            content_type='application/json')
        self.assertEqual(feedback.status_code, 200)
