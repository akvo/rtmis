import os
import uuid
import pandas as pd
from django.test import TestCase
from django.test.utils import override_settings
from django.core.management import call_command
from django.utils import timezone
from api.v1.v1_profile.models import Administration, Entity, EntityData
from api.v1.v1_jobs.models import Jobs
from api.v1.v1_jobs.constants import JobTypes, JobStatus
from api.v1.v1_profile.job import download_master_data
from api.v1.v1_profile.tests.mixins import ProfileTestHelperMixin
from utils.upload_entities import generate_list_of_entities


@override_settings(USE_TZ=False)
class DownloadEntitiesTestCase(TestCase, ProfileTestHelperMixin):
    def setUp(self) -> None:
        super().setUp()
        call_command("administration_seeder", "--test")
        self.user = self.create_user('test@akvo.org', self.ROLE_ADMIN)
        call_command("entities_seeder", "--test")

    def test_generate_excel_for_all_entities(self):
        file_path = "./entities.xlsx"
        file_output = generate_list_of_entities(file_path)
        self.assertTrue(os.path.exists(file_output))
        # read the file
        for entity in Entity.objects.all():
            df = pd.read_excel(file_output, sheet_name=entity.name)
            self.assertTrue(df.shape[0] > 0)
        # remove the file
        os.remove(file_output)

    def test_generate_excel_for_selected_entities(self):
        file_path = "./entities.xlsx"
        entities = Entity.objects.first()
        file_output = generate_list_of_entities(
            file_path=file_path,
            entity_ids=[entities.id]
        )
        self.assertTrue(os.path.exists(file_output))
        # read the file
        df = pd.read_excel(file_output, sheet_name=entities.name)
        self.assertTrue(df.shape[0] > 0)
        # make sure that the file does not contain other entities
        for entity in Entity.objects.exclude(id=entities.id):
            with self.assertRaises(ValueError):
                pd.read_excel(file_output, sheet_name=entity.name)
        # remove the file
        os.remove(file_output)

    def test_generate_excel_for_selected_entities_and_administration(self):
        file_path = "./entities.xlsx"
        entity_example = EntityData(
            name="Example",
            code="EX",
            administration=Administration.objects.filter(level=4).last(),
            entity=Entity.objects.first()
        )
        entity_example.save()
        file_output = generate_list_of_entities(
            file_path=file_path,
            adm_id=entity_example.administration.id
        )
        self.assertTrue(os.path.exists(file_output))
        # read the file
        df = pd.read_excel(file_output, sheet_name=entity_example.entity.name)
        # make sure that the row contains the first_entity_data
        self.assertTrue(
            df[df["Name"] == entity_example.name].shape[0] > 0
        )
        # remove the file
        os.remove(file_output)

    def test_generate_with_job(self):
        adm = Administration.objects.filter(level=4).last()
        entity_example = EntityData(
            name="Example II",
            code="EXII",
            administration=adm,
            entity=Entity.objects.first()
        )
        entity_example.save()
        today = timezone.datetime.today().strftime("%y%m%d")
        file_name = adm.name.replace(" ", "_").lower()
        out_file = "download-entities-{0}-{1}-{2}.xlsx".format(
            file_name.replace("/", "_"),
            today,
            uuid.uuid4()
        )
        info = {
            "file": out_file,
            "administration": adm.id,
            "entities": [{
                "id": entity_example.entity.id,
                "name": entity_example.entity.name
            }]
        }
        job = Jobs.objects.create(
            type=JobTypes.download_entities,
            user_id=self.user.id,
            status=JobStatus.on_progress,
            info=info,
            result=out_file,
        )
        file_output = download_master_data(job_id=job.id, job_type=job.type)
        # make sure the file output is inside folder /storage/download_entities
        self.assertTrue(os.path.exists(file_output))
        # read the file
        df = pd.read_excel(file_output, sheet_name=entity_example.entity.name)
        # make sure that the row contains the first_entity_data
        self.assertTrue(
            df[df["Name"] == entity_example.name].shape[0] > 0
        )
        # remove the file
        os.remove(file_output)
