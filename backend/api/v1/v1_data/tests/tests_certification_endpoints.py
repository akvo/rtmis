from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from django.db.models import Max
from rest_framework_simplejwt.tokens import RefreshToken
from faker import Faker

from api.v1.v1_forms.models import Forms, UserForms, SubmissionTypes
from api.v1.v1_profile.models import (
    Administration,
    Levels,
    Access,
    UserRoleTypes,
)
from api.v1.v1_profile.management.commands import administration_seeder
from api.v1.v1_data.models import FormData
from api.v1.v1_users.models import SystemUser

fake = Faker()


@override_settings(USE_TZ=False)
class CertificationEndpointsTestCase(TestCase):
    def create_user(
        self,
        email: str,
        role_level: int,
        password: str = "password",
        administration: Administration = None,
    ) -> SystemUser:
        profile = fake.profile()
        name = profile.get("name")
        name = name.split(" ")
        user = SystemUser.objects.create(
            email=email, first_name=name[0], last_name=name[1]
        )
        user.set_password(password)
        user.save()

        level = Levels.objects.filter(level=role_level).first()
        administration = (
            administration
            or Administration.objects.filter(level=level).order_by("?").first()
        )
        Access.objects.create(
            user=user,
            role=role_level,
            administration=administration,
        )
        return user

    def setUp(self):
        call_command("form_seeder", "--test")
        county = [
            ["Jakarta", "East Jakarta", "Kramat Jati", "Cawang"],
            ["Jakarta", "West Jakarta", "Kebon Jeruk", "Kebon Jeruk"],
            ["Yogyakarta", "Sleman", "Seturan", "Cepit Baru"],
            ["Yogyakarta", "Bantul", "Bantul", "Bantul"],
        ]
        administration_seeder.seed_administration_test(county=county)
        call_command("demo_approval_flow", "--test", True)
        call_command("fake_data_seeder", "-r", 2, "-t", True)
        self.form = Forms.objects.filter(type=1).first()
        self.assignee_level = Levels.objects.filter(name="Sub-County").first()
        # lowest_level
        self.target_level = Levels.objects.filter(name="Village").first()
        self.administration = Administration.objects.filter(
            level=self.assignee_level
        ).first()
        # get only id of the target administration
        adm_path = f"{self.administration.path}{self.administration.id}"
        self.target_administration = list(
            Administration.objects.filter(
                path__contains=self.administration.path,
                level=self.target_level,
            )
            .exclude(path__startswith=adm_path)
            .order_by("?")
            .values_list("id", flat=True)
        )
        # Create certification assignment by admin
        self.admin_user = self.create_user(
            email="admin@akvo.org", role_level=UserRoleTypes.super_admin
        )
        t = RefreshToken.for_user(self.admin_user)
        self.header = {"HTTP_AUTHORIZATION": f"Bearer {t.access_token}"}
        # Define assignment data
        assignment_data = {
            "assignee": self.administration.id,
            "administrations": self.target_administration,
        }

        # Create certification assignment using API
        self.client.post(
            "/api/v1/form/certification-assignment",
            assignment_data,
            content_type="application/json",
            **self.header,
        )
        # Setup user
        self.assignee_user = self.create_user(
            email="assignee@akvo.org",
            role_level=UserRoleTypes.approver,
            password="password",
            administration=self.administration,
        )
        target_adm_1 = Administration.objects.get(
            pk=self.target_administration[0]
        )
        self.target_user_1 = self.create_user(
            email="target1@akvo.org",
            role_level=UserRoleTypes.approver,
            password="password",
            administration=target_adm_1,
        )

        form = Forms.objects.get(pk=1)
        self.form = form
        UserForms.objects.get_or_create(form=form, user=self.assignee_user)
        UserForms.objects.get_or_create(form=form, user=self.target_user_1)

        # Fake data claim seeder
        call_command("fake_data_claim_seeder", "-r", 2, "-t", True)

    def test_open_certification_by_assignee(self):
        st = SubmissionTypes.certification
        t = RefreshToken.for_user(self.assignee_user)
        data = self.client.get(
            f"/api/v1/certifications/{self.form.id}?submission_type={st}",
            content_type="application/json",
            **{"HTTP_AUTHORIZATION": f"Bearer {t.access_token}"},
        )
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertNotEqual(data["total"], 0)

    def test_open_certification_by_target(self):
        st = SubmissionTypes.certification
        t = RefreshToken.for_user(self.target_user_1)
        data = self.client.get(
            f"/api/v1/certifications/{self.form.id}?submission_type={st}",
            content_type="application/json",
            **{"HTTP_AUTHORIZATION": f"Bearer {t.access_token}"},
        )
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data["total"], 0)

    def test_open_certification_by_admin(self):
        st = SubmissionTypes.certification
        t = RefreshToken.for_user(self.admin_user)
        data = self.client.get(
            f"/api/v1/certifications/{self.form.id}?submission_type={st}",
            content_type="application/json",
            **{"HTTP_AUTHORIZATION": f"Bearer {t.access_token}"},
        )
        self.assertEqual(data.status_code, 200)
        data = data.json()
        total = (
            FormData.objects.filter(
                submission_type=SubmissionTypes.certification
            )
            .values("uuid")
            .annotate(latest_id=Max("id"))
            .count()
        )
        self.assertEqual(data["total"], total)
