from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from api.v1.v1_forms.models import Forms


class FormSeederTestCase(TestCase):
    def call_command(self, *args, **kwargs):
        out = StringIO()
        call_command(
            "form_seeder",
            *args,
            stdout=out,
            stderr=StringIO(),
            **kwargs,
        )
        return out.getvalue()

    def test_call_command(self):

        self.maxDiff = None
        output = self.call_command()
        json_forms = [
            "Health Facilities",
            "Household",
            "CLTS",
            "WASH in School",
            "Water System",
        ]
        output = list(filter(lambda x: len(x), output.split("\n")))
        forms = Forms.objects.all()
        form_names = [form.name for form in forms]
        form_ids = [form.id for form in forms]
        self.assertEqual(forms.count(), 5)
        for json_form in json_forms:
            self.assertIn(f"Form Created | {json_form}", output)
            self.assertIn(json_form, form_names)
        for id in form_ids:
            response = self.client.get(f"/api/v1/web/form/{id}", follow=True)
            self.assertEqual(200, response.status_code)

        response = self.client.get("/api/v1/web/form/952774024", follow=True)
        response = response.json()
        self.assertEqual("Water Quality",
                         response["question_group"][0]["name"])
        self.assertEqual(968554020,
                         response["question_group"][0]["question"][0]['id'])
        self.assertEqual('Can we conduct a water quality test?',
                         response["question_group"][0]["question"][0]['name'])
        self.assertEqual(['id', 'name'],
                         list(response["question_group"][0]["question"][0][
                                  'option'][0]))
        self.assertEqual(False,
                         response["question_group"][0]["question"][0]['meta'])
        self.assertEqual(996974044,
                         response["question_group"][0]["question"][1]['id'])
        self.assertEqual('If yes, can we conduct a test on salinity (taste)?',
                         response["question_group"][0]["question"][1]['name'])
        self.assertEqual(['id', 'name'],
                         list(response["question_group"][0]["question"][1][
                                  'option'][0]))
        self.assertEqual(False,
                         response["question_group"][0]["question"][1]['meta'])
