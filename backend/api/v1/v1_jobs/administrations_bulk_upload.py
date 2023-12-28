import logging
import pandas as pd
from typing import Type, Union
from django.db.models import Model
from api.v1.v1_jobs.functions import ValidationText
from api.v1.v1_jobs.validate_upload import ExcelError

from api.v1.v1_profile.models import (
        Administration, AdministrationAttribute, Levels)

logger = logging.getLogger(__name__)


def seed_administration_data(io_file):
    df = pd.read_excel(io_file, sheet_name='data')
    columns = list(df)
    level_count = Levels.objects.count()
    level_map = map_column_model(columns[:level_count], Levels)
    attribute_map = map_column_model(
            columns[level_count:], AdministrationAttribute)
    data = df.to_dict('records')
    for row in data:
        last: Union[Administration, None] = None
        for key, level in level_map.items():
            obj, _ = Administration.objects.get_or_create(
                     name=row[key], level=level, parent=last)
            last = obj
        for key, attribute in attribute_map.items():
            if bool(pd.isnull(row[key])):
                continue
            value = parse_attribute_value(attribute, row[key])
            obj, created = last.attributes.get_or_create(
                    attribute=attribute, defaults={'value': value})
            if not created:
                obj.value = value
                obj.save(update_fields=['value'])


def parse_attribute_value(attribute: AdministrationAttribute, data: str):
    if attribute.type == AdministrationAttribute.Type.MULTIPLE_OPTION:
        return {'value': [v.strip() for v in data.split('|')]}
    if attribute.type == AdministrationAttribute.Type.AGGREGATE:
        value = {}
        rows = [v.strip() for v in data.split('|')]
        for row in rows:
            key, val = (it.strip() for it in row.split('='))
            value[key] = val
        return {'value': value}
    return {'value': str(data).strip()}


def map_column_model(columns, model: Type[Model]):
    map = {}
    for column in columns:
        id = column.split('|')[0]
        obj = model.objects.get(id=id)
        map[column] = obj
    return map


def validate_administrations_bulk_upload(io_file):
    excel_file = pd.ExcelFile(io_file)
    sheet_names = ['data']
    if sheet_names != excel_file.sheet_names:
        return [{
            "error": ExcelError.sheet,
            "error_message": ValidationText.template_validation.value,
            "sheets": ",".join(sheet_names)
        }]
    return []
