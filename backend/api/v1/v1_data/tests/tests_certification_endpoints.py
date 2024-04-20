from django.core.management import call_command
from django.test import TestCase
from django.test.utils import override_settings
from django.db.models import Count
from rest_framework_simplejwt.tokens import RefreshToken

from api.v1.v1_forms.models import Forms, UserForms, SubmissionTypes
from api.v1.v1_profile.models import Administration, Levels
from api.v1.v1_profile.tests.mixins import ProfileTestHelperMixin
from api.v1.v1_profile.management.commands import administration_seeder


@override_settings(USE_TZ=False)
class CertificationEndpointsTestCase(TestCase, ProfileTestHelperMixin):
    def setUp(self):
        call_command("form_seeder", "--test")
        county = [
            ["Jakarta", "East Jakarta", "Kramat Jati", "Cawang"],
            ["Jakarta", "West Jakarta", "Kebon Jeruk", "Kebon Jeruk"],
            ["Yogyakarta", "Sleman", "Seturan", "Cepit Baru"],
            ["Yogyakarta", "Bantul", "Bantul", "Bantul"]
        ]
        administration_seeder.seed_administration_test(county=county)
        call_command("fake_data_seeder", "-r", 10, "-t", True)
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
            Administration.objects.select_related("administration_form_data")
            .annotate(num_data=Count("administration_form_data"))
            .filter(
                path__contains=self.administration.path,
                level=self.target_level,
                num_data__gt=0
            )
            .exclude(path__startswith=adm_path)
            .order_by("?")
            .values_list("id", flat=True)
        )
        # Create certification assignment by admin
        admin_user = self.create_user(
            email="admin@akvo.org",
            role_level=self.ROLE_ADMIN
        )
        t = RefreshToken.for_user(admin_user)
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
            role_level=self.ROLE_APPROVER,
            password="password",
            administration=self.administration,
        )
        target_adm_1 = Administration.objects.get(
            pk=self.target_administration[0]
        )
        self.target_user_1 = self.create_user(
            email="target1@akvo.org",
            role_level=self.ROLE_APPROVER,
            password="password",
            administration=target_adm_1,
        )

        form = Forms.objects.get(pk=1)
        self.form = form
        UserForms.objects.get_or_create(form=form, user=self.assignee_user)
        UserForms.objects.get_or_create(form=form, user=self.target_user_1)

        # Fake data claim seeder
        call_command("fake_data_claim_seeder", "-r", 5, "-t", True)

    def test_open_certification_by_assignee(self):
        st = SubmissionTypes.certification
        t = RefreshToken.for_user(self.assignee_user)
        data = self.client.get(
            f"/api/v1/form-data/{self.form.id}?submission_type={st}",
            content_type='application/json',
            **{'HTTP_AUTHORIZATION': f'Bearer {t.access_token}'}
        )
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertNotEqual(data['total'], 0)

    def test_open_certification_by_target(self):
        st = SubmissionTypes.certification
        t = RefreshToken.for_user(self.target_user_1)
        data = self.client.get(
            f"/api/v1/form-data/{self.form.id}?submission_type={st}",
            content_type="application/json",
            **{"HTTP_AUTHORIZATION": f"Bearer {t.access_token}"},
        )
        self.assertEqual(data.status_code, 200)
        data = data.json()
        self.assertEqual(data["total"], 0)
