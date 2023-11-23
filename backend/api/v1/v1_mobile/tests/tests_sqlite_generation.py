import os
import pandas as pd
from nwmis.settings import MASTER_DATA
from django.test import TestCase
from api.v1.v1_profile.models import Administration
from api.v1.v1_users.models import Organisation
from django.core.management import call_command
from utils.custom_generator import generate_sqlite


class SQLiteGenerationTest(TestCase):
    def setUp(self):
        call_command("administration_seeder")
        call_command("organisation_seeder", "--test")
        self.administration = Administration.objects.all()
        self.organization = Organisation.objects.all()

    def test_generate_sqlite(self):
        # Test for Organisation
        conn, file_name = generate_sqlite(Organisation)
        self.assertTrue(os.path.exists(file_name))
        self.assertEqual(
            len(self.organization),
            len(pd.read_sql_query("SELECT * FROM nodes", conn))
        )
        conn.close()
        os.remove(file_name)

        # Test for Administration
        conn, file_name = generate_sqlite(Administration)
        self.assertTrue(os.path.exists(file_name))
        self.assertEqual(
            len(self.administration),
            len(pd.read_sql_query("SELECT * FROM nodes", conn))
        )
        conn.close()
        os.remove(file_name)

    def test_sqlite_generation_command(self):
        call_command("generate_sqlite")
        generated_administration_sqlite = f"{MASTER_DATA}/administrator.sqlite"
        generated_organisation_sqlite = f"{MASTER_DATA}/administrator.sqlite"
        self.assertTrue(os.path.exists(generated_administration_sqlite))
        self.assertTrue(os.path.exists(generated_organisation_sqlite))

    def test_sqlite_file_endpoint(self):

        conn, file_name = generate_sqlite(Administration)
        self.assertTrue(os.path.exists(file_name))
        self.assertEqual(
            len(self.administration),
            len(pd.read_sql_query("SELECT * FROM nodes", conn))
        )
        conn.close()
        file = file_name.split("/")[-1]
        endpoint = f"/api/v1/device/sqlite/{file}"
        response = self.client.get(endpoint)
        self.assertEqual(response.status_code, 200)
