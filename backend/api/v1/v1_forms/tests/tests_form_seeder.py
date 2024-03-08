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
            "CLTS",
            "Water System",
            "RTMIS Community Monitoring Form",
            "RTMIS School WASH Form",
            "RTMIS Household Monitoring Form",
            "Short HH",
            "RTMIS Institution Form",
            "RTMIS Healthcare Facility WASH Form",
            "Governance Form",
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

        # TEST USING ./source/short-test-form.test.json
        response = self.client.get("/api/v1/form/web/16993539153551",
                                   follow=True,
                                   content_type='application/json',
                                   **{'HTTP_AUTHORIZATION': f'Bearer {token}'})
        self.assertEqual(200, response.status_code)
        response = response.json()
        administration_found = False
        for qg in response["question_group"]:
            for q in qg["question"]:
                if q["id"] == 16993548493821:
                    self.assertEqual("cascade", q["type"])
                    self.assertEqual(
                        {
                            "endpoint": "/api/v1/administration",
                            "initial": 1,
                            "list": "children"
                        },
                        q["api"],
                    )
                    administration_found = True
        self.assertTrue(administration_found)

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
            if q['name'] == 'gender'
        ][0]
        self.assertIn('tooltip', gender)
        self.assertIn('color', gender['option'][0])
        autofield = [
            q for q in data['question_group'][0]['question']
            if q['name'] == 'autofield'
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
            if q['name'] == 'gender'
        ][0]
        self.assertIn('pre', gender)
        hidden = [
            q for q in data['question_group'][0]['question']
            if q['name'] == 'hidden'
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
            if q['name'] == 'name'
        ][0]
        self.assertIn('displayOnly', name)
        self.assertTrue(name['displayOnly'])
        phone = [
            q for q in data['question_group'][0]['question']
            if q['name'] == 'phone'
        ][0]
        self.assertIn('monitoring', phone)
        self.assertEqual(phone['short_label'], "Phone Number")
        self.assertTrue(phone['monitoring'])
