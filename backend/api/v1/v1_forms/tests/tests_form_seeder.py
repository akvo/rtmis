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

        output = self.call_command()
        json_forms = [
            "WASH in Health Centres",
            "Household Survey",
            "Bacteria Result for Health Centre Survey",
            "School Questionnaires",
            "Bacteria Result for School Survey",
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
            response = self.client.get(f"/api/v1/form/{id}",
                                       follow=True)

            self.assertEqual(200, response.status_code)
