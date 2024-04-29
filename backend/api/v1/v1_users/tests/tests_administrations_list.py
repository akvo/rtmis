from django.test import TestCase
from django.test.utils import override_settings
from api.v1.v1_profile.management.commands import administration_seeder
from api.v1.v1_profile.models import (
    Administration, Levels, UserRoleTypes, Access
)
from api.v1.v1_users.models import SystemUser
from api.v1.v1_data.models import SubmissionTypes


@override_settings(USE_TZ=False)
class AdministrationsListTestCase(TestCase):
    def setUp(self):
        county = [
            ["Jakarta", "East Jakarta", "Kramat Jati", "Cawang"],
            ["Jakarta", "West Jakarta", "Kebon Jeruk", "Kebon Jeruk"],
            ["Yogyakarta", "Sleman", "Seturan", "Cepit Baru"],
            ["Yogyakarta", "Bantul", "Bantul", "Bantul"],
        ]
        administration_seeder.seed_administration_test(county=county)
        self.assignee_level = Levels.objects.filter(name="Sub-County").first()
        self.target_level = Levels.objects.filter(name="Village").first()
        self.assignee = Administration.objects.filter(
            level=self.assignee_level
        ).first()
        assignee_path = f"{self.assignee.path}{self.assignee.id}"
        self.targets = list(
            Administration.objects
            .filter(
                path__contains=self.assignee.path,
                level=self.target_level,
            )
            .exclude(path__startswith=assignee_path)
            .order_by("?")
            .values_list("id", flat=True)
        )

        user = SystemUser.objects.create_user(
            email='test@test.org',
            password='test1234',
            first_name='test',
            last_name='testing',
        )
        self.administration = Administration.objects.filter(
            parent__isnull=True
        ).first()
        role = UserRoleTypes.admin
        Access.objects.create(
            user=user,
            role=role,
            administration=self.administration
        )
        admin = {"email": user.email, "password": 'test1234'}
        admin = self.client.post(
            '/api/v1/login',
            admin,
            content_type='application/json'
        )
        admin = admin.json()
        token = admin.get("token")
        # Create certification assignment
        assignment_data = {
            "assignee": self.assignee.id,
            "administrations": self.targets,
        }

        # Create certification assignment using API
        self.client.post(
            "/api/v1/form/certification-assignment",
            assignment_data,
            content_type="application/json",
            **{'HTTP_AUTHORIZATION': f'Bearer {token}'}
        )

    def test_get_administration(self):
        res = self.client.get(
            f"/api/v1/administration/{self.administration.id}"
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data["children"]), 2)

    def test_get_administration_with_max_level(self):
        ml = 1
        administration = Administration.objects.filter(
            level__level=ml
        ).first()
        res = self.client.get(
            f"/api/v1/administration/{administration.id}?max_level={ml}"
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["children"], [])

    def test_filter_administration(self):
        administration = Administration.objects.get(pk=1)
        children = administration.parent_administration.first()
        res = self.client.get(
            f"/api/v1/administration/{administration.id}?filter={children.id}"
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data["children"]), 1)
        self.assertEqual(data["children"][0]['name'], children.name)

    def test_certification_administrations(self):
        st = SubmissionTypes.certification
        res = self.client.get(
            f"/api/v1/administration/{self.assignee.id}?submission_type={st}"
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertNotEqual(data['id'], self.assignee.id)
