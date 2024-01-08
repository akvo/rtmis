from io import StringIO

from django.test.utils import override_settings
from django.core.management import call_command
from api.v1.v1_profile.models import Administration, Levels
from django.test import TestCase

from api.v1.v1_forms.models import Forms


def seed_administration_test():
    level = Levels(name="country", level=1)
    level.save()
    administration = Administration(id=1,
                                    name="Indonesia",
                                    parent=None,
                                    level=level)
    administration.save()
    administration = Administration(id=2,
                                    name="Jakarta",
                                    parent=administration,
                                    level=level)
    administration.save()


@override_settings(USE_TZ=False)
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

    def get_question_group(self, form, question_group_name):
        return [
            g for g in form['question_group']
            if g['name'] == question_group_name
        ][0]

    def get_user_token(self):
        user = {"email": "admin@rush.com", "password": "Test105*"}
        user = self.client.post('/api/v1/login',
                                user,
                                content_type='application/json')
        user = user.json()
        return user.get("token")

    def test_call_command(self):

        self.maxDiff = None
        seed_administration_test()
        forms = Forms.objects.all().delete()
        json_forms = [
            "Governance and policy",
            "Health Facilities",
            "Household",
            "Urban Sanitation",
            "CLTS",
            "WASH in Schools",
            "Water System",
            "RTMIS Community Monitoring Form",
            "RTMIS School WASH Form",
            "RTMIS Household Monitoring Form",
        ]

        # RUN SEED NEW FORM
        output = self.call_command()
        output = list(filter(lambda x: len(x), output.split("\n")))
        forms = Forms.objects.all()
        self.assertEqual(forms.count(), len(json_forms))
        for form in forms:
            self.assertIn(f"Form Created | {form.name} V{form.version}",
                          output)
            self.assertIn(form.name, json_forms)

        # RUN UPDATE EXISTING FORM
        output = self.call_command()
        output = list(filter(lambda x: len(x), output.split("\n")))
        forms = Forms.objects.all()
        form_ids = [form.id for form in forms]
        for form in forms:
            if form.version == 2:
                self.assertIn(f"Form Updated | {form.name} V{form.version}",
                              output)
            # FOR NON PRODUCTION FORM
            if form.version == 1:
                self.assertIn(f"Form Created | {form.name} V{form.version}",
                              output)
            self.assertIn(form.name, json_forms)

        token = self.get_user_token()
        self.assertTrue(token)
        for id in form_ids:
            response = self.client.get(
                f"/api/v1/form/web/{id}",
                follow=True,
                content_type='application/json',
                **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
            self.assertEqual(200, response.status_code)
        response = self.client.get("/api/v1/form/web/519630048",
                                   follow=True,
                                   content_type='application/json',
                                   **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(200, response.status_code)
        response = response.json()
        self.assertEqual("Introduction", response["question_group"][0]["name"])
        self.assertEqual(364240038,
                         response["question_group"][0]["question"][0]['id'])
        self.assertEqual('Name of the data collector (Enumerator)',
                         response["question_group"][0]["question"][0]['name'])
        self.assertEqual(True,
                         response["question_group"][0]["question"][0]['meta'])
        self.assertEqual(5196300481,
                         response["question_group"][0]["question"][1]['id'])
        self.assertEqual('Organisation',
                         response["question_group"][0]["question"][1]['name'])
        self.assertEqual({"endpoint": "/api/v1/organisations?attributes=2"},
                         response["question_group"][0]["question"][1]['api'])
        self.assertEqual(517690051,
                         response["question_group"][0]["question"][2]['id'])
        self.assertEqual('Household code',
                         response["question_group"][0]["question"][2]['name'])
        self.assertEqual(
            ['id', 'name', 'order'],
            list(response["question_group"][0]["question"][3]['option'][0]))
        self.assertEqual(False,
                         response["question_group"][0]["question"][3]['meta'])

        response = self.client.get("/api/v1/form/519630048",
                                   follow=True,
                                   content_type='application/json')
        self.assertEqual(200, response.status_code)
        response = response.json()
        introduction = self.get_question_group(response, 'Introduction')
        demographics = self.get_question_group(response, 'Demographics')
        self.assertEqual(
            ["chart", "aggregate", "table", "advanced_filter"],
            demographics["question"][3]["attributes"])
        self.assertEqual('Enumerator', introduction["question"][0]['name'])
        self.assertEqual('Name of the data collector (Enumerator)',
                         introduction["question"][0]['text'])

    def test_additional_attributes(self):
        seed_administration_test()
        self.call_command('--test')
        token = self.get_user_token()
        form_id = 2

        response = self.client.get(
            f"/api/v1/form/web/{form_id}",
            follow=True,
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {token}'})

        data = response.json()
        self.assertIn('approval_instructions', data)
        gender = [
            q for q in data['question_group'][0]['question']
            if q['name'] == 'Gender'
        ][0]
        self.assertIn('tooltip', gender)
        self.assertIn('color', gender['option'][0])
        autofield = [
            q for q in data['question_group'][0]['question']
            if q['name'] == 'Autofield'
        ][0]
        self.assertIn('fn', autofield)

    def test_question_pre_and_hidden_field(self):
        seed_administration_test()
        self.call_command('--test')
        token = self.get_user_token()
        form_id = 2

        response = self.client.get(
            f"/api/v1/form/web/{form_id}",
            follow=True,
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {token}'})

        data = response.json()
        gender = [
            q for q in data['question_group'][0]['question']
            if q['name'] == 'Gender'
        ][0]
        self.assertIn('pre', gender)
        hidden = [
            q for q in data['question_group'][0]['question']
            if q['name'] == 'Hidden'
        ][0]
        self.assertIn('hidden', hidden)

    def test_display_only_and_monitoring_field(self):
        seed_administration_test()
        self.call_command('--test')
        token = self.get_user_token()
        form_id = 2

        response = self.client.get(
            f"/api/v1/form/web/{form_id}",
            follow=True,
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {token}'})

        data = response.json()
        name = [
            q for q in data['question_group'][0]['question']
            if q['name'] == 'Name'
        ][0]
        self.assertIn('displayOnly', name)
        self.assertTrue(name['displayOnly'])
        phone = [
            q for q in data['question_group'][0]['question']
            if q['name'] == 'Phone Number'
        ][0]
        self.assertIn('monitoring', phone)
        self.assertTrue(phone['monitoring'])
