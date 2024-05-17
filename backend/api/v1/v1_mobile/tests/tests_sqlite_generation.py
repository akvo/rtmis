import os
import sqlite3
import pandas as pd
from api.v1.v1_profile.tests.utils import AdministrationEntitiesTestFactory
from rtmis.settings import MASTER_DATA
from django.test import TestCase
from api.v1.v1_profile.models import Administration, Entity, EntityData
from api.v1.v1_users.models import Organisation
from django.core.management import call_command
from utils.custom_generator import generate_sqlite, update_sqlite


class SQLiteGenerationTest(TestCase):
    def setUp(self):
        call_command("administration_seeder")
        call_command("organisation_seeder", "--test")
        self.administration = Administration.objects.all()
        self.organization = Organisation.objects.all()

    def test_generate_sqlite(self):
        # Test for Organisation
        file_name = generate_sqlite(Organisation)
        self.assertTrue(os.path.exists(file_name))
        conn = sqlite3.connect(file_name)
        self.assertEqual(
            len(self.organization),
            len(pd.read_sql_query("SELECT * FROM nodes", conn)),
        )
        conn.close()
        os.remove(file_name)

        # Test for Administration
        file_name = generate_sqlite(Administration)
        self.assertTrue(os.path.exists(file_name))
        conn = sqlite3.connect(file_name)
        self.assertEqual(
            len(self.administration),
            len(pd.read_sql_query("SELECT * FROM nodes", conn)),
        )
        conn.close()
        os.remove(file_name)

    def test_sqlite_generation_command(self):
        call_command("generate_sqlite")
        generated_administration_sqlite = f"{MASTER_DATA}/administrator.sqlite"
        generated_organisation_sqlite = f"{MASTER_DATA}/organisation.sqlite"
        self.assertTrue(os.path.exists(generated_administration_sqlite))
        self.assertTrue(os.path.exists(generated_organisation_sqlite))

    def test_sqlite_file_endpoint(self):
        file_name = generate_sqlite(Administration)
        self.assertTrue(os.path.exists(file_name))
        conn = sqlite3.connect(file_name)
        self.assertEqual(
            len(self.administration),
            len(pd.read_sql_query("SELECT * FROM nodes", conn)),
        )
        conn.close()
        file = file_name.split("/")[-1]
        endpoint = f"/api/v1/device/sqlite/{file}"
        response = self.client.get(endpoint)
        self.assertEqual(response.status_code, 200)

    def test_update_sqlite_org_added(self):
        # Test for adding new org
        file_name = generate_sqlite(Organisation)
        self.assertTrue(os.path.exists(file_name))

        org = Organisation.objects.create(name="SQLite Company")
        update_sqlite(
            model=Organisation, data={"id": org.id, "name": org.name}
        )
        conn = sqlite3.connect(file_name)
        self.assertEqual(
            1,
            len(
                pd.read_sql_query(
                    "SELECT * FROM nodes where id = ?", conn, params=[org.id]
                )
            ),
        )
        conn.close()
        os.remove(file_name)

    def test_update_sqlite_org_updated(self):
        # Test for adding new org
        file_name = generate_sqlite(Organisation)
        self.assertTrue(os.path.exists(file_name))

        new_org_name = "Edited Company"
        org = Organisation.objects.last()
        org.name = new_org_name
        org.save()
        update_sqlite(
            model=Organisation, data={"name": new_org_name}, id=org.id
        )

        conn = sqlite3.connect(file_name)
        self.assertEqual(
            1,
            len(
                pd.read_sql_query(
                    "SELECT * FROM nodes where name = ?",
                    conn,
                    params=[new_org_name],
                )
            ),
        )
        conn.close()
        os.remove(file_name)


class EntitiesSQLiteGenerationTest(TestCase):
    def setUp(self):
        super().setUp()
        call_command("organisation_seeder", "--test")
        AdministrationEntitiesTestFactory(
            {
                "name": "Indonesia",
                "children": [
                    {
                        "name": "Jakarta",
                        "children": [
                            {
                                "name": "Jakarta Selatan",
                                "children": [
                                    {
                                        "name": "Pasar Minggu",
                                        "entities": [
                                            {
                                                "entity": "Rumah Sakit",
                                                "name": "RSUD Jati Padang",
                                            },
                                            {
                                                "entity": "Sekolah",
                                                "name": "SD NEGERI CILANDAK TIMUR 01",
                                            },
                                        ],
                                    },
                                    {
                                        "name": "Setiabudi",
                                        "entities": [
                                            {
                                                "entity": "Rumah Sakit",
                                                "name": "RS Agung",
                                            },
                                            {
                                                "entity": "Sekolah",
                                                "name": "SD MENTENG ATAS 21 PAGI",
                                            },
                                        ],
                                    },
                                ],
                            }
                        ],
                    }
                ],
            }
        ).populate()

    def test_generate_entity(self):
        file_name = generate_sqlite(Entity)
        self.assertTrue(os.path.exists(file_name))
        conn = sqlite3.connect(file_name)
        df = pd.read_sql_query("SELECT * FROM nodes", conn)
        self.assertEqual(
            list(Entity.objects.all().values_list("name", flat=True)),
            df["name"].values.tolist(),
        )
        conn.close()
        os.remove(file_name)

    def test_generate_entity_data(self):
        file_name = generate_sqlite(EntityData)
        self.assertTrue(os.path.exists(file_name))
        conn = sqlite3.connect(file_name)
        df = pd.read_sql_query("SELECT * FROM nodes", conn)
        self.assertEqual(
            list(EntityData.objects.all().values_list("name", flat=True)),
            df["name"].values.tolist(),
        )
        conn.close()
        os.remove(file_name)

    def test_sqlite_generation_command(self):
        call_command("generate_sqlite")
        generated_entity_sqlite = f"{MASTER_DATA}/entities.sqlite"
        generated_entity_data_sqlite = f"{MASTER_DATA}/entity_data.sqlite"
        self.assertTrue(os.path.exists(generated_entity_sqlite))
        self.assertTrue(os.path.exists(generated_entity_data_sqlite))
