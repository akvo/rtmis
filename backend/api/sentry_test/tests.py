from django.test import TestCase


class TestSettings(TestCase):
    # test sentry
    def test_sentry(self):
        from os import environ
        sentry_dsn = environ["SENTRY_DSN"]
        self.assertIsNotNone(sentry_dsn)

    # test /sentry-debug/
    # def test_sentry_debug(self):
    #     response = self.client.get("/api/sentry_debug/")
    #     self.assertEqual(response.status_code, 404)
