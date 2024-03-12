from io import StringIO

from django.test.utils import override_settings
from django.core.management import call_command
from django.test import TestCase
from api.v1.v1_forms.management.commands.download_forms_from_afs import forms


@override_settings(USE_TZ=False)
class DownloadFormsAFSTestCase(TestCase):
    def call_command(self, *args, **kwargs):
        out = StringIO()
        call_command(
            "download_forms_from_afs",
            "--test",
            stdout=out,
            stderr=StringIO(),
            **kwargs,
        )
        return out.getvalue()

    def test_call_command(self):
        # RUN DOWNLOAD FORMS FROM AFS
        output = self.call_command()
        output = list(filter(lambda x: len(x), output.split("\n")))
        for form in forms:
            form_id = form['id']
            form_name = form['name']
            self.assertIn(
                f"Form Downloaded | {form_id} {form_name}",
                output
            )
