from django.utils import timezone
from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from api.v1.v1_forms.models import Forms
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Administration, Levels, Access
from api.v1.v1_users.models import SystemUser, Organisation


@override_settings(USE_TZ=False)
class FormApprovalTestCase(TestCase):
    def setUp(self):
        call_command("form_seeder", "--test")
        call_command("administration_seeder", "--test")
        call_command("fake_organisation_seeder", "--repeat", 3)
        user = {"email": "admin@rush.com", "password": "Test105*"}
        user = self.client.post('/api/v1/login',
                                user,
                                content_type='application/json')
        user = user.json()
        token = user.get("token")
        self.header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        self.org = Organisation.objects.order_by('?').first()
        # call_command("demo_approval_flow")
        self.form = Forms.objects.filter(type=1).first()

    def test_add_approval(self):
        email = "test_approver@example.com"
        admin = Administration.objects.filter(
            level=Levels.objects.filter(level=3).first()
        ).order_by('?').first()
        payload = {
            "first_name": "Test",
            "last_name": "Approver",
            "email": email,
            "administration": admin.id,
            "organisation": self.org.id,
            "role": UserRoleTypes.approver,
            "forms": [self.form.id],
            "trained": True,
        }
        add_response = self.client.post("/api/v1/user",
                                        payload,
                                        content_type='application/json',
                                        **self.header)
        user = SystemUser.objects.filter(email=email).first()
        user.set_password("Test105*")
        user.updated = timezone.now()
        user.date_joined = timezone.now()
        user.save()
        access = Access.objects.filter(user=user).first()
        self.assertEqual(access.administration, admin)
        self.assertEqual(add_response.status_code, 200)
        approval_response = self.client.get(
            "/api/v1/form/approver/?administration_id={}&form_id={}".format(
                admin.parent.id, self.form.id
            ),
            content_type='application/json',
            **self.header)
        self.assertEqual(approval_response.status_code, 200)
        self.assertEqual(approval_response.json(), [{
            'administration': {
                'id': admin.id,
                'name': admin.name,
            },
            'user': {
                'id': user.id,
                'email': email,
                'first_name': 'Test',
                'last_name': 'Approver',
            }
        }])

        # check approver
        response = self.client.get(
            f"/api/v1/form/check-approver/{self.form.id}",
            content_type='application/json',
            **self.header)
        self.assertEqual(404, response.status_code)
        self.assertEqual(
            response.json(),
            {'message': 'National level does not have an approver'}
        )

        # check approver
        login_as_approver = self.client.post(
            '/api/v1/login',
            {"email": email, "password": "Test105*"},
            content_type='application/json')
        login_as_approver = login_as_approver.json()
        approver_token = login_as_approver.get("token")
        approver_header = {'HTTP_AUTHORIZATION': f'Bearer {approver_token}'}
        response = self.client.get(
            f"/api/v1/form/check-approver/{self.form.id}",
            content_type='application/json',
            **approver_header)
        self.assertEqual(200, response.status_code)
        self.assertEqual(list(response.json()), ['count'])
