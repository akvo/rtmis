import pandas as pd

from django.test import TestCase
from django.test.utils import override_settings

from django.core.management import call_command
from api.v1.v1_profile.tests.mixins import ProfileTestHelperMixin
from api.v1.v1_profile.models import (
    Entity,
    Administration,
    Levels,
    EntityData,
)


def validate_entity_data(filename):
    errors = []
    last_level = Levels.objects.all().order_by("level").last()
    for entity in Entity.objects.all():
        df = pd.read_excel(filename, sheet_name=entity.name)
        # remove rows with empty Name
        df = df.dropna(subset=["Name"])
        # remove exact duplicate rows
        df = df.drop_duplicates()
        for index, row in df.iterrows():
            path = ""
            adm_names = []
            failed = False
            administration = None
            for level in Levels.objects.all().order_by("level"):
                if row[level.name] is not None:
                    row_value = row[level.name]
                    adm_names += [row_value]
                    administration = Administration.objects.filter(
                        name=row_value, level=level
                    ).first()
                    if not administration:
                        failed = True
                        continue
                    if administration.path:
                        if path and not administration.path.startswith(path):
                            failed = True
                    if administration and not failed:
                        path += f"{administration.id}."
            if failed:
                adm_names = " - ".join(adm_names)
                errors.append({
                    "sheet": entity.name,
                    "row": index + 2,
                    "message": f"Invalid Administration for {adm_names}",
                })
            else:
                if level == last_level:
                    # skip if the entity data already exists
                    entity_name = row["Name"]
                    entity_data = EntityData.objects.filter(
                        name=entity_name,
                        entity=entity,
                        administration=administration,
                    ).first()
                    if not entity_data:
                        EntityData.objects.create(
                            name=entity_name,
                            code=row["Code"] if "Code" in df.columns else None,
                            entity=entity,
                            administration=administration,
                        )
    return errors


def validate_entity_file(filename):
    xl = pd.ExcelFile(filename)
    sheet_names = xl.sheet_names
    errors = []
    # check if the sheet names are correct
    for sheet in sheet_names:
        entity = Entity.objects.filter(name=sheet).first()
        if not entity:
            errors.append({
                "sheet": sheet,
                "row": 1,
                "message": f"Entity of {sheet} not found",
            })
        else:
            # check if the columns are correct
            df = pd.read_excel(filename, sheet_name=sheet)
            required_columns = Levels.objects.all().values_list(
                "name", flat=True
            )
            required_columns = list(required_columns) + ["Name", "Code"]
            for column in df.columns:
                if column not in required_columns:
                    errors.append({
                        "sheet": sheet,
                        "row": 1,
                        "message": f"Level {column} not found",
                    })
            if "Name" not in df.columns:
                errors.append({
                    "sheet": sheet,
                    "row": 1,
                    "message": "Name column not found",
                })
    return errors


@override_settings(USE_TZ=False)
class EntityTestBulkUploadCase(TestCase, ProfileTestHelperMixin):
    def setUp(self):
        super().setUp()
        call_command("administration_seeder", "--test")
        self.user = self.create_user("test@akvo.org", self.ROLE_ADMIN)
        call_command("entities_seeder", "--test")
        self.token = self.get_auth_token(self.user.email)
        self.test_file = "api/v1/v1_profile/tests/fixtures/entities-test.xlsx"

    def test_bulk_upload(self):
        # validate the entity file
        error_list = validate_entity_file(self.test_file)
        self.assertEqual(
            error_list, [{
                "sheet": "Train Station",
                "row": 1,
                "message": "Entity of Train Station not found",
            }],
        )
        # validate the entity data
        total_entities_before = EntityData.objects.count()
        error_list = validate_entity_data(self.test_file)
        e_1 = "Indonesia - Yogyakarta - Sleman - Depok - Catur Tunggal"
        e_2 = "Indonesia - Yogyakarta - East Jakarta - Kramat Jati - Cawang"
        error_prediction = [
            {
                "sheet": "School",
                "row": 5,
                "message": f"Invalid Administration for {e_1}",
            },
            {
                "sheet": "School",
                "row": 6,
                "message": f"Invalid Administration for {e_2}",
            },
        ]
        self.assertEqual(error_list, error_prediction)
        successful_upload = EntityData.objects.count() - total_entities_before
        self.assertEqual(successful_upload, 5)
