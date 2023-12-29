import logging
import pandas as pd
from typing import Type, Union
from django.db.models import Model
from pandas.core.frame import itertools
from api.v1.v1_jobs.functions import ValidationText
from api.v1.v1_jobs.validate_upload import ExcelError, generate_excel_columns

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


def map_column_names(columns):
    map = {}
    for column in columns:
        id, name = (v for v in column.split('|'))
        map[id] = name
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
    df = pd.read_excel(io_file, sheet_name='data')
    if df.shape[0] == 0:
        return [{
            "error": ExcelError.sheet,
            "error_message": ValidationText.file_empty_validation.value,
        }]
    errors = []
    headers = list(df)
    level_count = Levels.objects.count()
    errors = errors + validate_level_headers(headers[:level_count])
    errors = errors + validate_attribute_headers(
        headers[level_count:], level_count)
    return errors


def validate_level_headers(headers):
    levels = {
            lvl.id: lvl.name for lvl in
            Levels.objects.order_by('level').all()}
    excel_cols = list(itertools.islice(generate_excel_columns(), len(levels)))
    level_id_map = [(id, name) for id, name in levels.items()]
    errors = []
    for idx, key in enumerate(level_id_map):
        default_error = {
                'error': ExcelError.header, 'cell': f"{excel_cols[idx]}1"}
        try:
            header = headers[idx]
            if '|' not in header:
                default_error.update({
                    'error_message': ValidationText.header_invalid_level.value
                })
                errors.append(default_error)
                continue
            header_id, header_name = (v for v in header.split('|'))
            if key == (int(header_id), header_name):
                continue
            default_error.update({
                'error_message': ValidationText.header_invalid_level.value
            })
            errors.append(default_error)
        except IndexError:
            errors.append({
                'error': ExcelError.header,
                'error_message': ValidationText.header_name_missing.value,
                'cell': f"{excel_cols[idx]}1",
            })
    return errors


def validate_attribute_headers(headers, offset):
    if not headers:
        return []
    excel_cols = list(itertools.islice(
        generate_excel_columns(),
        len(headers) + offset
    ))[offset:]
    attribute_id_map = get_available_attributes(headers)
    errors = []
    for idx, col in enumerate(excel_cols):
        default_error = {'error': ExcelError.header, 'cell': f"{col}1"}
        header = headers[idx]
        if '|' not in header:
            default_error.update({
                'error_message': ValidationText.header_invalid_attribute.value
            })
            errors.append(default_error)
            continue
        header_id, header_name = (v for v in header.split('|'))
        if (int(header_id), header_name) in attribute_id_map:
            continue
        default_error.update({
            'error_message': ValidationText.header_invalid_attribute.value
        })
        errors.append(default_error)
    return errors


def get_available_attributes(columns):
    column_ids = [int(c.split('|')[0]) for c in columns if '|' in c]
    attributes = AdministrationAttribute.objects\
        .filter(id__in=column_ids)\
        .values('id', 'name')
    return [(a['id'], a['name']) for a in attributes]
