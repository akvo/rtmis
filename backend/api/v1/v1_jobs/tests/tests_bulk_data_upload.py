from django.core.management import call_command
from django.test import TestCase
from django.db.models import Count
from api.v1.v1_jobs.functions import ValidationText
from api.v1.v1_jobs.validate_upload import validate
from api.v1.v1_jobs.models import Jobs, JobTypes, JobStatus
from api.v1.v1_jobs.seed_data import seed_excel_data
from api.v1.v1_forms.models import Forms
from api.v1.v1_data.models import FormData
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.models import Administration
from api.v1.v1_profile.tests.mixins import ProfileTestHelperMixin
from api.v1.v1_data.management.commands.fake_data_seeder import (
    add_fake_answers
)


class BulkUploadDataTestCase(TestCase, ProfileTestHelperMixin):
    def setUp(self):
        super().setUp()
        call_command("administration_seeder", "--test")
        call_command("form_seeder", "--test")

        user_payload = {"email": "admin@rush.com", "password": "Test105*"}
        user_response = self.client.post('/api/v1/login',
                                         user_payload,
                                         content_type='application/json')
        res = user_response.json()
        self.user = SystemUser.objects.filter(
            email=res["email"]
        ).first()

        self.test_folder = "api/v1/v1_jobs/tests/fixtures"

    def test_upload_empty_data(self):
        form = Forms.objects.get(pk=1)

        administration = Administration.objects.filter(
            level__name="Village"
        ).first()
        upload_file = f"{self.test_folder}/test-error-empty-data.xlsx"
        output = validate(
            form=form,
            administration=administration.id,
            file=upload_file
        )
        self.assertEqual(
            output[0]["error_message"],
            ValidationText.file_empty_validation.value
        )

    def test_upload_submission_type_is_required(self):
        form = Forms.objects.get(pk=1)
        upload_file = "{0}/test-error-submission_type-required.xlsx".format(
            self.test_folder
        )

        administration = Administration.objects.filter(
            name="Cawang"
        ).first()
        output = validate(
            form=form,
            administration=administration.id,
            file=upload_file
        )
        self.assertEqual(len(output), 2)
        self.assertEqual(
            output[0]["error_message"],
            f"submission_type {ValidationText.is_required.value}"
        )
        self.assertEqual(
            output[1]["error_message"],
            f"submission_type {ValidationText.is_required.value}"
        )

    def test_upload_error_dependency(self):
        form = Forms.objects.get(pk=1)
        upload_file = "{0}/test-error-dependency.xlsx".format(
            self.test_folder
        )

        administration = Administration.objects.filter(
            name="Cawang"
        ).first()
        output = validate(
            form=form,
            administration=administration.id,
            file=upload_file
        )
        self.assertEqual(len(output), 2)
        self.assertEqual(
            output[0]["error_message"],
            "whats_the_pet {0}".format(
                ValidationText.should_be_empty.value
            )
        )
        self.assertEqual(
            output[1]["error_message"],
            "whats_the_pet {0}".format(
                ValidationText.is_required.value
            )
        )

    def test_upload_success_empty_default_value(self):
        form = Forms.objects.get(pk=1)
        upload_file = "{0}/test-success-empty-default-value.xlsx".format(
            self.test_folder
        )

        administration = Administration.objects.filter(
            name="Cepit Baru"
        ).first()
        validation = validate(
            form=form,
            administration=administration.id,
            file=upload_file
        )
        self.assertEqual(len(validation), 0)
        job = Jobs.objects.create(
            type=JobTypes.seed_data,
            status=JobStatus.done,
            user=self.user,
            info={
                "file": upload_file,
                "form": form.id,
                "is_update": False,
            },
        )
        seed_excel_data(job=job, test=True)

        datapoint = FormData.objects.filter(
            uuid="6bf1c83f-b596-458f-be04-73015104d8d2"
        ).first()
        self.assertTrue(datapoint)

    def test_upload_success_empty_meta_uuid(self):
        form = Forms.objects.get(pk=1)
        upload_file = "{0}/test-success-empty-meta-uuid.xlsx".format(
            self.test_folder
        )

        administration = Administration.objects.filter(
            name="Cepit Baru"
        ).first()
        validation = validate(
            form=form,
            administration=administration.id,
            file=upload_file
        )
        self.assertEqual(len(validation), 0)
        job = Jobs.objects.create(
            type=JobTypes.seed_data,
            status=JobStatus.done,
            user=self.user,
            info={
                "file": upload_file,
                "form": form.id,
                "is_update": False,
            },
        )
        seed_excel_data(job=job, test=True)

        name1 = "new - John Doe - 2223913 - Cepit Baru - children"
        dp1 = form.form_form_data.filter(
            name=name1
        ).first()
        self.assertTrue(dp1)
        self.assertNotEqual(dp1.uuid, None)

        name2 = \
            "new - Jane Doe - 3323914 - Cepit Baru - wife__husband__partner"
        dp2 = form.form_form_data.filter(
            name=name2
        ).first()
        self.assertTrue(dp2)
        self.assertNotEqual(dp2.uuid, None)

    def test_upload_new_registration_data(self):
        form = Forms.objects.get(pk=1)
        upload_file = "{0}/test-success-new-registration.xlsx".format(
            self.test_folder
        )

        administration = Administration.objects.filter(
            name="Cawang"
        ).first()
        validation = validate(
            form=form,
            administration=administration.id,
            file=upload_file
        )
        self.assertEqual(len(validation), 0)

        job = Jobs.objects.create(
            type=JobTypes.seed_data,
            status=JobStatus.done,
            user=self.user,
            info={
                "file": upload_file,
                "form": form.id,
                "is_update": False,
            },
        )
        seed_excel_data(job=job, test=True)

        name1 = "new - John Doe - 23911 - Cawang - wife__husband__partner"
        dp1 = form.form_form_data.filter(
            name=name1
        ).first()
        self.assertTrue(dp1)

        name2 = "new - Jane Doe - 1123912 - Cawang - parent"
        dp2 = form.form_form_data.filter(
            name=name2
        ).first()
        self.assertTrue(dp2)

    def test_upload_update_registration_data(self):
        form = Forms.objects.get(pk=1)
        administration = Administration.objects.filter(
            name="Cawang"
        ).first()
        name = "new - John Doe - 44 – wife__husband__partner"
        FormData.objects.all().delete()
        data = FormData.objects.create(
            id=1,
            name=name,
            geo=["-8.6384108", "116.2469499"],
            form=form,
            administration=administration,
            created_by=self.user,
        )
        data.save()
        add_fake_answers(data, form.type)

        upload_file = "{0}/test-success-update-registration.xlsx".format(
            self.test_folder
        )
        validation = validate(
            form=form,
            administration=administration.id,
            file=upload_file
        )

        self.assertEqual(len(validation), 0)

        job = Jobs.objects.create(
            type=JobTypes.seed_data,
            status=JobStatus.done,
            user=self.user,
            info={
                "file": upload_file,
                "form": form.id,
                "is_update": False,
            },
        )
        seed_excel_data(job=job, test=True)

        updated_dp = FormData.objects.annotate(
            history_count=Count("data_answer_history")
        ).filter(
            form=form,
            history_count__gt=0
        ).first()
        self.assertTrue(updated_dp)

    def test_upload_new_monitoring_data(self):
        meta_uuid = "82a860a5-9c7e-4ab8-9bbc-cdf4a544f85e"
        form = Forms.objects.get(pk=1)
        administration = Administration.objects.filter(
            name="Cawang"
        ).first()
        FormData.objects.all().delete()
        name = "new - Jane Doe - 44 – wife__husband__partner"
        data = FormData.objects.create(
            id=2,
            uuid=meta_uuid,
            name=name,
            geo=["-8.6384108", "116.2469499"],
            form=form,
            administration=administration,
            created_by=self.user,
        )
        data.save()
        add_fake_answers(data, form.type)

        upload_file = "{0}/test-success-new-monitoring.xlsx".format(
            self.test_folder
        )

        datapoint = form.form_form_data.first()
        datapoint.uuid = meta_uuid
        datapoint.save()

        validation = validate(
            form=form,
            administration=datapoint.administration.id,
            file=upload_file
        )
        self.assertEqual(len(validation), 0)

        job = Jobs.objects.create(
            type=JobTypes.seed_data,
            status=JobStatus.done,
            user=self.user,
            info={
                "file": upload_file,
                "form": form.id,
                "is_update": False,
            },
        )
        seed_excel_data(job=job, test=True)

        data_count = FormData.objects.filter(
            uuid=datapoint.uuid
        ).count()

        self.assertGreater(data_count, 1)
