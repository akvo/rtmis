from io import BytesIO
from django.core.management import call_command
from django.test import TestCase
from django.db.models import Count
import pandas as pd
from api.v1.v1_jobs.functions import ValidationText
from api.v1.v1_jobs.validate_upload import validate
from api.v1.v1_jobs.models import Jobs, JobTypes, JobStatus
from api.v1.v1_jobs.seed_data import seed_excel_data
from api.v1.v1_forms.models import Forms
from api.v1.v1_data.models import FormData
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.models import Administration
from api.v1.v1_profile.tests.mixins import ProfileTestHelperMixin
from utils.export_form import blank_data_template


def write_inmemory_excel_file(form: Forms, df: pd.DataFrame) -> BytesIO:
    iofile = BytesIO()
    writer = pd.ExcelWriter(iofile, engine='xlsxwriter')
    blank_data_template(form=form, writer=writer)
    df.to_excel(writer, sheet_name='data', index=False)
    writer.save()
    return iofile


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

        call_command("demo_approval_flow", "--test", True)
        call_command("fake_data_seeder", "-r", 1, "-t", True)
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
        upload_file = "{0}/test-success-update-registration.xlsx".format(
            self.test_folder
        )
        datapoint = form.form_form_data.first()
        datapoint_adm = datapoint.administration.full_name.replace(" - ", "|")
        df = pd.read_excel(upload_file, sheet_name='data')
        df.loc[0, 'id'] = datapoint.id
        df.loc[0, 'datapoint_name'] = datapoint.name
        df.loc[0, 'administration'] = datapoint_adm
        df.loc[0, 'location'] = datapoint_adm

        upload_file_temp = write_inmemory_excel_file(form=form, df=df)
        validation = validate(
            form=form,
            administration=datapoint.administration.id,
            file=upload_file_temp
        )

        self.assertEqual(len(validation), 0)

        with open(upload_file, "wb") as f:
            f.write(upload_file_temp.getbuffer())

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
        form = Forms.objects.get(pk=1)
        upload_file = "{0}/test-success-new-monitoring.xlsx".format(
            self.test_folder
        )
        datapoint = form.form_form_data.first()
        datapoint_adm = datapoint.administration.full_name.replace(" - ", "|")
        df = pd.read_excel(upload_file, sheet_name='data')
        df.loc[0, 'id'] = datapoint.id
        df.loc[0, 'datapoint_name'] = datapoint.name
        df.loc[0, 'administration'] = datapoint_adm
        df.loc[0, 'location'] = datapoint_adm
        df.loc[0, 'meta_uuid'] = datapoint.uuid

        upload_file_temp = write_inmemory_excel_file(form=form, df=df)

        validation = validate(
            form=form,
            administration=datapoint.administration.id,
            file=upload_file_temp
        )
        self.assertEqual(len(validation), 0)

        with open(upload_file, "wb") as f:
            f.write(upload_file_temp.getbuffer())

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
