from django.test import TestCase
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.models import Administration, Access
from api.v1.v1_profile.constants import UserRoleTypes
from django.core.management import call_command


class MobileAssignmentManagerTest(TestCase):
    def setUp(self):
        call_command('administration_seeder', '--test')
        call_command('form_seeder', '--test')
        self.user = SystemUser.objects.create_user(
            email='test@test.org',
            password='test1234',
            first_name='test',
            last_name='testing',
        )
        self.administration = Administration.objects.filter(
            parent__isnull=True
        ).first()
        role = UserRoleTypes.user
        self.user_access = Access.objects.create(
            user=self.user, role=role, administration=self.administration
        )

    def test_create_mobile_assignment_without_passcode(self):
        from api.v1.v1_mobile.models import MobileAssignment
        from utils.custom_helper import CustomPasscode

        # Test without passcode
        mobile_assignment = MobileAssignment.objects.create_assignment(
            user=self.user, name='test'
        )
        self.assertEqual(mobile_assignment.user, self.user)
        # Passcode is not stored in plain text
        self.assertNotEqual(len(mobile_assignment.get_passcode()), 8)
        passcode = mobile_assignment.get_passcode()
        passcode = CustomPasscode().decode(passcode)
        self.assertEqual(len(passcode), 8)

    def test_create_mobile_assignment_with_passcode(self):
        from api.v1.v1_mobile.models import MobileAssignment
        from utils.custom_helper import CustomPasscode

        # Test with passcode
        mobile_assignment = MobileAssignment.objects.create_assignment(
            user=self.user, name='test', passcode='passcode1234'
        )
        self.assertEqual(mobile_assignment.user, self.user)
        # Passcode is not stored in plain text
        mobile_assignment = MobileAssignment.objects.get(user=self.user)
        self.assertNotEqual(mobile_assignment.passcode, 'passcode1234')
        passcode = mobile_assignment.get_passcode()
        passcode = CustomPasscode().decode(passcode)
        self.assertEqual(passcode, 'passcode1234')

    def test_update_mobile_assignment_passcode(self):
        # Test update passcode
        from api.v1.v1_mobile.models import MobileAssignment
        from utils.custom_helper import CustomPasscode

        mobile_assignment = MobileAssignment.objects.create_assignment(
            user=self.user, name='test', passcode='passcode1234'
        )
        self.assertEqual(mobile_assignment.user, self.user)
        passcode = mobile_assignment.get_passcode()
        passcode = CustomPasscode().decode(passcode)
        self.assertEqual(passcode, 'passcode1234')

        # Update passcode
        mobile_assignment = MobileAssignment.objects.get(user=self.user)
        mobile_assignment.set_passcode('newpasscode1234')
        mobile_assignment.save()
        passcode = mobile_assignment.get_passcode()
        passcode = CustomPasscode().decode(passcode)
        self.assertNotEqual(mobile_assignment.passcode, 'newpasscode1234')
        self.assertEqual(passcode, 'newpasscode1234')
