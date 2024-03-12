from django.core import signing
from django.core.management import call_command
from django.test import TestCase
from rest_framework_simplejwt.tokens import RefreshToken

from django.test.utils import override_settings
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.management.commands.administration_seeder import (
        geo_config)
from api.v1.v1_users.models import SystemUser, Organisation
from api.v1.v1_forms.models import FormApprovalAssignment
from utils.email_helper import EmailTypes


@override_settings(USE_TZ=False)
class UserInvitationTestCase(TestCase):
    def setUp(self):
        call_command("administration_seeder", "--test")
        call_command("fake_organisation_seeder")
        call_command("form_seeder", "--test")
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        user = user_response.json()
        self.token = user.get('token')
        self.header = {'HTTP_AUTHORIZATION': f'Bearer {self.token}'}
        self.org = Organisation.objects.order_by('?').first()

    def test_user_list(self):
        response = self.client.get("/api/v1/users?administration=1&role=1",
                                   follow=True,
                                   **self.header)
        users = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(users['data'][0]['first_name'], 'Admin')
        self.assertEqual(users['data'][0]['last_name'], 'RUSH')
        self.assertEqual(users['data'][0]['email'], 'admin@rush.com')
        self.assertEqual(users['data'][0]['administration'], {
            'id': 1,
            'name': 'Indonesia',
            'level': 0,
            'full_name': 'Indonesia'
        })
        self.assertEqual(users['data'][0]['role'], {
            'id': 1,
            'value': 'Super Admin'
        })
        call_command("fake_user_seeder", "-r", 100)
        response = self.client.get("/api/v1/users?page=3",
                                   follow=True,
                                   **self.header)
        users = response.json()
        self.assertEqual(len(users['data']), 10)
        self.assertEqual([
            'id',
            'first_name',
            'last_name',
            'email',
            'administration',
            'organisation',
            'trained',
            'role',
            'phone_number',
            'designation',
            'invite',
            'forms',
            'last_login'
        ], list(users['data'][0]))
        response = self.client.get("/api/v1/users?pending=true",
                                   follow=True,
                                   **self.header)

        self.assertGreater(len(response.json().get('data')), 0)
        self.assertEqual(response.status_code, 200)
        # test trained filter
        response = self.client.get("/api/v1/users?trained=true",
                                   follow=True,
                                   **self.header)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json().get('data')), 0)
        # search by fullname
        response = self.client.get("/api/v1/users?search=admin rush",
                                   follow=True,
                                   **self.header)
        users = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(users['data'][0]['email'], 'admin@rush.com')
        self.assertEqual(users['data'][0]['first_name'], 'Admin')
        self.assertEqual(users['data'][0]['last_name'], 'RUSH')
        # search by email
        response = self.client.get("/api/v1/users?search=admin@rush",
                                   follow=True,
                                   **self.header)
        users = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(users['data'][0]['email'], 'admin@rush.com')
        self.assertEqual(users['data'][0]['first_name'], 'Admin')
        self.assertEqual(users['data'][0]['last_name'], 'RUSH')
        # test filter user if not super admin user logged in
        call_command("fake_user_seeder", "-r", 10)
        find_user = SystemUser.objects.filter(
            user_access__role=UserRoleTypes.admin).first()
        token = RefreshToken.for_user(find_user)
        response = self.client.get(
            "/api/v1/users?page=1&administration={}".format(
                find_user.user_access.administration_id),
            follow=True,
            **{'HTTP_AUTHORIZATION': f'Bearer {token.access_token}'})
        users = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(list(users),
                         ['current', 'data', 'total', 'total_page'])

    def test_add_edit_user(self):
        payload = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@example.com",
            "administration": 2,
            "organisation": self.org.id,
            "forms": [1],
            "trained": True,
            "inform_user": True,
        }
        add_response = self.client.post("/api/v1/user",
                                        payload,
                                        content_type='application/json',
                                        **self.header)
        self.assertEqual(add_response.status_code, 400)
        payload["role"] = UserRoleTypes.admin
        add_response = self.client.post("/api/v1/user",
                                        payload,
                                        content_type='application/json',
                                        **self.header)

        self.assertEqual(add_response.status_code, 200)
        self.assertEqual(add_response.json(),
                         {'message': 'User added successfully'})

        edit_payload = {
            "first_name": "Joe",
            "last_name": "Doe",
            "email": "john@example.com",
            "administration": 2,
            "organisation": self.org.id,
            "trained": False,
            "role": 6,
            "forms": [1, 2],
            "inform_user": True,
        }
        list_response = self.client.get("/api/v1/users?pending=true",
                                        follow=True,
                                        **self.header)
        users = list_response.json()
        fl = list(
            filter(lambda x: x['email'] == 'john@example.com', users['data']))

        add_response = self.client.put("/api/v1/user/{0}".format(fl[0]['id']),
                                       edit_payload,
                                       content_type='application/json',
                                       **self.header)
        self.assertEqual(add_response.status_code, 400)
        edit_payload["role"] = UserRoleTypes.user
        add_response = self.client.put("/api/v1/user/{0}".format(fl[0]['id']),
                                       edit_payload,
                                       content_type='application/json',
                                       **self.header)
        self.assertEqual(add_response.status_code, 400)
        edit_payload["role"] = UserRoleTypes.admin
        add_response = self.client.put("/api/v1/user/{0}".format(fl[0]['id']),
                                       edit_payload,
                                       content_type='application/json',
                                       **self.header)
        self.assertEqual(add_response.status_code, 200)
        self.assertEqual(add_response.json(),
                         {'message': 'User updated successfully'})
        edit_payload["role"] = UserRoleTypes.admin
        edit_payload["forms"] = [2]
        add_response = self.client.put("/api/v1/user/{0}".format(fl[0]['id']),
                                       edit_payload,
                                       content_type='application/json',
                                       **self.header)
        self.assertEqual(add_response.status_code, 200)
        self.assertEqual(add_response.json(),
                         {'message': 'User updated successfully'})
        # change administration
        edit_payload["administration"] = 3
        add_response = self.client.put("/api/v1/user/{0}".format(fl[0]['id']),
                                       edit_payload,
                                       content_type='application/json',
                                       **self.header)
        self.assertEqual(add_response.status_code, 200)
        self.assertEqual(add_response.json(),
                         {'message': 'User updated successfully'})

        get_response = self.client.get("/api/v1/user/{0}".format(fl[0]['id']),
                                       content_type='application/json',
                                       **self.header)
        self.assertEqual(get_response.status_code, 200)
        responses = get_response.json()
        self.assertEqual([
            'first_name', 'last_name', 'email', 'administration',
            'organisation', 'trained', 'role', 'phone_number', 'designation',
            'forms', 'approval_assignment', 'pending_approval', 'data',
            'pending_batch'
        ], list(responses))
        self.assertEqual(responses["forms"],
                         [{'id': 2, 'name': 'Test Form 2'}])
        edit_payload["forms"] = [1, 2]
        add_response = self.client.put("/api/v1/user/{0}".format(fl[0]['id']),
                                       edit_payload,
                                       content_type='application/json',
                                       **self.header)
        self.assertEqual(add_response.status_code, 200)
        self.assertEqual(add_response.json(),
                         {'message': 'User updated successfully'})
        get_response = self.client.get("/api/v1/user/{0}".format(fl[0]['id']),
                                       content_type='application/json',
                                       **self.header)
        self.assertEqual(get_response.status_code, 200)
        responses = get_response.json()
        self.assertEqual([
            'first_name', 'last_name', 'email', 'administration',
            'organisation', 'trained', 'role', 'phone_number', 'designation',
            'forms', 'approval_assignment', 'pending_approval', 'data',
            'pending_batch'
        ], list(responses))
        self.assertEqual(responses["forms"],
                         [{'id': 1, 'name': 'Test Form'},
                          {'id': 2, 'name': 'Test Form 2'}])

        # test_update_user_with_pending_approval
        call_command("fake_pending_data_seeder", "--test")
        find_user = SystemUser.objects.filter(
            user_access__role=UserRoleTypes.admin).order_by('-id').first()
        edit_payload = {
            "first_name": find_user.first_name,
            "last_name": find_user.last_name,
            "email": find_user.email,
            "administration": find_user.user_access.administration_id + 1,
            "organisation": self.org.id,
            "trained": False,
            "role": find_user.user_access.role,
            "forms": [fr.form_id for fr in find_user.user_form.all()],
            "inform_user": True,
        }
        response = self.client.put("/api/v1/user/{0}".format(find_user.id),
                                   edit_payload,
                                   content_type='application/json',
                                   **self.header)
        self.assertEqual(response.status_code, 403)

    def test_add_admin_user(self):
        payload = {
            "first_name": "County",
            "last_name": "Admin",
            "email": "county_admin@example.com",
            "administration": 2,
            "organisation": self.org.id,
            "role": 2,
            "forms": [1],
            "trained": False,
        }
        add_response = self.client.post("/api/v1/user",
                                        payload,
                                        content_type='application/json',
                                        **self.header)
        self.assertEqual(add_response.status_code, 200)
        self.assertEqual(add_response.json(),
                         {'message': 'User added successfully'})
        user = SystemUser.objects.filter(
            email="county_admin@example.com").first()
        form_approval_assignment = FormApprovalAssignment.objects.filter(
            form=1, administration=2, user=user).first()
        self.assertEqual(form_approval_assignment.user, user)
        # Add user for same form and administration
        payload = {
            "first_name": "Second County",
            "last_name": "Admin",
            "email": "county_admin2@example.com",
            "administration": 2,
            "organisation": self.org.id,
            "role": 2,
            "forms": [1],
            "trained": False,
        }
        add_response = self.client.post("/api/v1/user",
                                        payload,
                                        content_type='application/json',
                                        **self.header)
        self.assertEqual(add_response.status_code, 403)
        # Add user for different administration
        payload = {
            "first_name": "Third County",
            "last_name": "Admin",
            "email": "county_admin3@example.com",
            "administration": 3,
            "organisation": self.org.id,
            "role": 2,
            "forms": [1],
            "trained": False,
        }
        add_response = self.client.post("/api/v1/user",
                                        payload,
                                        content_type='application/json',
                                        **self.header)
        self.assertEqual(add_response.status_code, 200)

    def test_add_aprroval_user(self):
        payload = {
            "first_name": "Test",
            "last_name": "Approver",
            "email": "test_approver@example.com",
            "administration": 2,
            "organisation": self.org.id,
            "role": 3,
            "forms": [1],
            "trained": True,
        }
        add_response = self.client.post("/api/v1/user",
                                        payload,
                                        content_type='application/json',
                                        **self.header)
        self.assertEqual(add_response.status_code, 200)
        self.assertEqual(add_response.json(),
                         {'message': 'User added successfully'})
        user = SystemUser.objects.filter(
            email="test_approver@example.com").first()
        form_approval_assignment = FormApprovalAssignment.objects.filter(
            form=1, administration=2, user=user).first()
        self.assertEqual(form_approval_assignment.user, user)
        # Add user for same form and administration
        payload = {
            "first_name": "Test Second",
            "last_name": "Approver",
            "email": "test2_approver@example.com",
            "administration": 2,
            "organisation": self.org.id,
            "role": 3,
            "forms": [1],
            "trained": True,
        }
        add_response = self.client.post("/api/v1/user",
                                        payload,
                                        content_type='application/json',
                                        **self.header)
        self.assertEqual(add_response.status_code, 403)
        # Add user for different administration
        payload = {
            "first_name": "Test Third",
            "last_name": "Approver",
            "email": "test3_approver@example.com",
            "administration": 3,
            "organisation": self.org.id,
            "role": 3,
            "forms": [1],
            "trained": True,
        }
        add_response = self.client.post("/api/v1/user",
                                        payload,
                                        content_type='application/json',
                                        **self.header)
        self.assertEqual(add_response.status_code, 200)
        # Add another role with same form and administration
        payload = {
            "first_name": "Data",
            "last_name": "Entry",
            "email": "data_entry@example.com",
            "administration": 3,
            "organisation": self.org.id,
            "role": 4,
            "forms": [1],
            "trained": True,
        }
        add_response = self.client.post("/api/v1/user",
                                        payload,
                                        content_type='application/json',
                                        **self.header)
        self.assertEqual(add_response.status_code, 200)
        user = SystemUser.objects.filter(
            email="data_entry@example.com").first()
        form_approval_assignment = FormApprovalAssignment.objects.filter(
            form=1, administration=3, user=user).first()
        self.assertEqual(form_approval_assignment, None)
        # Add another role with same form and administration
        payload = {
            "first_name": "Second Data",
            "last_name": "Entry",
            "email": "data_entry2@example.com",
            "administration": 3,
            "organisation": self.org.id,
            "role": 4,
            "forms": [1],
            "trained": True,
        }
        add_response = self.client.post("/api/v1/user",
                                        payload,
                                        content_type='application/json',
                                        **self.header)
        self.assertEqual(add_response.status_code, 200)

        # Add national super admin approver
        payload = {
            "first_name": "National Approver",
            "last_name": "Entry",
            "email": "national_approver@example.com",
            "organisation": self.org.id,
            "role": 1,
            "forms": [1],
            "trained": True,
        }
        add_response = self.client.post("/api/v1/user",
                                        payload,
                                        content_type='application/json',
                                        **self.header)
        self.assertEqual(add_response.status_code, 400)
        self.assertEqual(
            add_response.json(),
            {"message": "Super Admin can only approve National Type of form"})
        payload["forms"] = [2]
        add_response = self.client.post("/api/v1/user",
                                        payload,
                                        content_type='application/json',
                                        **self.header)
        self.assertEqual(add_response.status_code, 200)

    def test_get_user_profile(self):
        response = self.client.get("/api/v1/profile",
                                   content_type='application/json',
                                   **self.header)
        self.assertEqual(response.status_code, 200)
        self.assertEqual([
            'email', 'name', 'administration', 'trained',
            'role', 'phone_number', 'designation', 'forms',
            'organisation', 'last_login', 'passcode'
        ], list(response.json().keys()))

    def test_get_user_roles(self):
        response = self.client.get(
            "/api/v1/user/roles",
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(4, len(response.json()))
        self.assertEqual(['id', 'value'], list(response.json()[0].keys()))

    #
    def test_verify_invite(self):
        user = SystemUser.objects.first()
        invite_payload = 'dummy-token'
        invite_response = self.client.get(
            '/api/v1/invitation/{0}'.format(invite_payload),
            content_type='application/json')
        self.assertEqual(invite_response.status_code, 400)

        invite_payload = signing.dumps(user.pk)
        invite_response = self.client.get(
            '/api/v1/invitation/{0}'.format(invite_payload),
            content_type='application/json')
        self.assertEqual(invite_response.json(), {'name': "Admin RUSH"})
        self.assertEqual(invite_response.status_code, 200)

    def test_set_user_password(self):
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        self.client.post('/api/v1/login',
                         user_payload,
                         content_type='application/json')
        user = SystemUser.objects.first()
        password_payload = {
            'invite': 'dummy-token',
            'password': 'Test105*',
            'confirm_password': 'Test105*'
        }
        invite_response = self.client.put('/api/v1/user/set-password',
                                          password_payload,
                                          content_type='application/json')
        self.assertEqual(invite_response.status_code, 400)
        password_payload = {
            'invite': signing.dumps(user.pk),
            'password': 'Test105*',
            'confirm_password': 'Test105*'
        }
        invite_response = self.client.put('/api/v1/user/set-password',
                                          password_payload,
                                          content_type='application/json')
        self.assertEqual(invite_response.status_code, 200)

    def test_list_administration(self):
        administration = self.client.get('/api/v1/administration/1',
                                         content_type='application/json')
        self.assertEqual(administration.status_code, 200)

        response = self.client.get('/api/v1/levels',
                                   content_type='application/json')
        levels = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), len(geo_config))
        self.assertEqual(list(levels[0]), ['id', 'name', 'level'])

    def test_get_email_template(self):
        # test get user_register template
        response = self.client.get('/api/v1/email_template?type={0}'.format(
            EmailTypes.user_register))
        self.assertEqual(response.status_code, 200)
        # test get user_approval template
        response = self.client.get('/api/v1/email_template?type={0}'.format(
            EmailTypes.user_approval))
        self.assertEqual(response.status_code, 200)
        # test get user_forgot_password template
        response = self.client.get('/api/v1/email_template?type={0}'.format(
            EmailTypes.user_forgot_password))
        self.assertEqual(response.status_code, 200)
        # test get user_invite template
        response = self.client.get('/api/v1/email_template?type={0}'.format(
            EmailTypes.user_invite))
        self.assertEqual(response.status_code, 200)
        # test get data_approval template
        response = self.client.get('/api/v1/email_template?type={0}'.format(
            EmailTypes.data_approval))
        self.assertEqual(response.status_code, 200)
        # test get data_rejection template
        response = self.client.get('/api/v1/email_template?type={0}'.format(
            EmailTypes.data_rejection))
        self.assertEqual(response.status_code, 200)
        # test get batch_approval template
        response = self.client.get('/api/v1/email_template?type={0}'.format(
            EmailTypes.batch_approval))
        self.assertEqual(response.status_code, 200)
        # test get batch_rejection template
        response = self.client.get('/api/v1/email_template?type={0}'.format(
            EmailTypes.batch_rejection))
        self.assertEqual(response.status_code, 200)
        # test get inform_batch_rejection_to_approval template
        response = self.client.get('/api/v1/email_template?type={0}'.format(
            EmailTypes.inform_batch_rejection_approver))
        self.assertEqual(response.status_code, 200)
        # test get pending_approval template
        response = self.client.get('/api/v1/email_template?type={0}'.format(
            EmailTypes.pending_approval))
        self.assertEqual(response.status_code, 200)
        # test get upload_error template
        response = self.client.get('/api/v1/email_template?type={0}'.format(
            EmailTypes.upload_error))
        self.assertEqual(response.status_code, 200)
        # test get new_request template
        response = self.client.get('/api/v1/email_template?type={0}'.format(
            EmailTypes.new_request))
        self.assertEqual(response.status_code, 200)
        # test get unchanged_data template
        response = self.client.get('/api/v1/email_template?type={0}'.format(
            EmailTypes.unchanged_data))
        self.assertEqual(response.status_code, 200)
        # not send type
        response = self.client.get('/api/v1/email_template')
        self.assertEqual(response.status_code, 400)
        # test invalid type
        response = self.client.get('/api/v1/email_template?type=registration')
        self.assertEqual(response.status_code, 400)

    def test_delete_user(self):
        call_command("administration_seeder", "--test")
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        user = user_response.json()
        token = user.get('token')
        header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        call_command("fake_user_seeder")
        call_command("demo_approval_flow")
        u = SystemUser.objects.filter(
            user_access__role__in=[
                UserRoleTypes.approver, UserRoleTypes.user],
            password__isnull=False).first()
        response = self.client.delete('/api/v1/user/{0}'.format(u.id),
                                      content_type='application/json',
                                      **header)
        self.assertEqual(response.status_code, 204)
        user = SystemUser.objects_deleted.get(pk=u.id)
        self.assertEqual(user.deleted_at is not None, True)
        # test login with deleted user
        deleted_user = {"email": user.email, "password": "test"}
        response = self.client.post('/api/v1/login',
                                    deleted_user,
                                    content_type='application/json')
        self.assertEqual(response.status_code, 401)
        # get deleted user
        response = self.client.get('/api/v1/user/{0}'.format(u.id),
                                   content_type='application/json',
                                   **header)
        self.assertEqual(response.status_code, 404)

    def test_re_adding_user(self):
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")
        call_command("fake_organisation_seeder", "--repeat", 3)
        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        user = user_response.json()
        token = user.get('token')
        header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        call_command("fake_user_seeder")
        call_command("fake_approver_seeder")
        u = SystemUser.objects.filter(
            user_access__role__in=[
                UserRoleTypes.approver,
                UserRoleTypes.user
            ],
            password__isnull=False).first()
        # delete the user first
        response = self.client.delete('/api/v1/user/{0}'.format(u.id),
                                      content_type='application/json',
                                      **header)
        self.assertEqual(response.status_code, 204)
        user = SystemUser.objects_deleted.get(pk=u.id)
        self.assertEqual(user.deleted_at is not None, True)

        header = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        # re adding the deleted user
        org = Organisation.objects.order_by('?').last()
        payload = {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "organisation": org.id,
            "role": 3,
            "forms": [1],
            "administration": 2,
            "trained": True,
        }
        add_response = self.client.post(
            "/api/v1/user",
            payload,
            content_type='application/json',
            **header
        )
        self.assertEqual(add_response.status_code, 200)
        self.assertEqual(
            add_response.json(),
            {'message': 'User added successfully'}
        )
        form_approval_assignment = FormApprovalAssignment.objects.filter(
            form=1, administration=2, user=user).first()
        self.assertEqual(form_approval_assignment.user, user)
