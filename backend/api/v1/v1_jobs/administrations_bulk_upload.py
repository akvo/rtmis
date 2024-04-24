from collections import OrderedDict
import logging
from django.db import transaction
import pandas as pd
from typing import Any, Dict, List, Tuple, Type, Union
from django.db.models import Model
from pandas.core.frame import itertools
from api.v1.v1_jobs.functions import ValidationText
from api.v1.v1_jobs.validate_upload import ExcelError, generate_excel_columns

from api.v1.v1_profile.models import (
        Administration, AdministrationAttribute, Levels)

logger = logging.getLogger(__name__)


# [[ SEEDER ]]

@transaction.atomic
def seed_administration_data(io_file):
    df = pd.read_excel(io_file, sheet_name='data')
    columns = list(df)
    level_count = Levels.objects.count()
    level_map = map_column_model(columns[:level_count], Levels)
    attribute_map = map_column_model(
            columns[level_count:], AdministrationAttribute)
    records = df.to_dict('records')
    for row in records:
        administration_data = []
        for col, level in level_map.items():
            if bool(pd.isnull(row[col])):
                break
            administration_data.append((level, row[col]))
        target_administration = seed_administrations(administration_data)
        if not target_administration:
            break
        attribute_data = []
        for col, attribute in attribute_map.items():
            if bool(pd.isnull(row[col])):
                continue
            attribute_data.append((attribute, row[col], col))
        seed_attributes(target_administration, attribute_data)


def seed_administrations(
        data: List[Tuple[Levels, str]]) -> Union[Administration, None]:
    last_obj = None
    for item in data:
        level, name = item
        obj, _ = Administration.objects.get_or_create(
            name=name, level=level, parent=last_obj)
        last_obj = obj
    return last_obj


def seed_attributes(
        administration: Administration,
        data: List[Tuple[AdministrationAttribute, str, str]]):
    grouped = group_attributes(data)
    for attribute, val in grouped.items():
        value = {'value': val}
        obj, created = administration.attributes.get_or_create(
            attribute=attribute, defaults={'value': value}
        )
        if not created:
            obj.value = value
            obj.save(update_fields=['value'])


def group_attributes(
    data: List[Tuple[AdministrationAttribute, str, str]]
) -> Dict[AdministrationAttribute, Any]:
    grouped = OrderedDict()
    for item in data:
        attribute, val, col = item
        if attribute.type == AdministrationAttribute.Type.MULTIPLE_OPTION:
            grouped[attribute] = [v.strip() for v in val.split('|')]
            continue
        if attribute.type == AdministrationAttribute.Type.AGGREGATE:
            opt = [v.strip() for v in col.split('|')][-1]
            grouped.setdefault(attribute, {})
            grouped[attribute][opt] = str(val).strip()
            continue
        grouped[attribute] = str(val).strip()
    return grouped


def map_column_model(columns, model: Type[Model]):
    map = {}
    for column in columns:
        id = column.split('|')[0]
        obj = model.objects.get(id=id)
        map[column] = obj
    return map


# [[ VALIDATOR ]]

def validate_administrations_bulk_upload(io_file):
    excel_file = pd.ExcelFile(io_file)
    if "data" not in excel_file.sheet_names:
        return [{
            "error": ExcelError.sheet,
            "error_message": ValidationText.template_validation.value,
            "sheets": ",".join(excel_file.sheet_names)
        }]
    df = pd.read_excel(io_file, sheet_name='data')
    if df.shape[0] == 0:
        return [{
            "error": ExcelError.sheet,
            "error_message": ValidationText.file_empty_validation.value,
        }]
    headers = list(df)
    header_count = len(headers)
    levels = list(Levels.objects.all())
    level_count = len(levels)
    excel_cols = list(itertools.islice(
        generate_excel_columns(),
        header_count if header_count > level_count else level_count))
    attributes = get_selected_attributes(headers[level_count:])
    errors = []
    errors = errors + validate_level_headers(
            levels, headers[:level_count], excel_cols[:level_count])
    attribute_errors, attribute_results = validate_attribute_headers(
            attributes, headers[level_count:], excel_cols[level_count:])
    errors = errors + attribute_errors
    return errors if errors \
        else validate_administration_attribute_values(df, attribute_results)


def validate_administration_attribute_values(df, attribute_column_map):
    type_validations = {
        AdministrationAttribute.Type.OPTION:
            validate_attribute_option_value,
        AdministrationAttribute.Type.MULTIPLE_OPTION:
            validate_attribute_multioption_value,
    }
    filtered_attributes = OrderedDict([
        (header, item) for header, item in attribute_column_map.items()
        if item['attribute'].type in type_validations.keys()
    ])
    errors = []
    for header, item in filtered_attributes.items():
        values = list(df[header])
        attribute = item['attribute']
        options = attribute.options
        for row, value in enumerate(values):
            validate = type_validations[attribute.type]
            invalids = validate(value, options)
            if not invalids:
                continue
            errors.append({
                'error': ExcelError.value,
                'error_message':
                    ValidationText.invalid_attribute_options.value.format(
                        ', '.join(map(str, invalids)), str(options)
                    ),
                'cell': f"{item['col']}{row+2}",
            })
    return errors


def validate_attribute_option_value(data, options):
    if data in options:
        return
    return [data]


def validate_attribute_multioption_value(data, options):
    values = [it.strip() for it in data.split('|')]
    invalids = []
    for value in values:
        if value in options:
            continue
        invalids.append(value)
    return invalids


def get_selected_attributes(columns):
    if not columns:
        return []
    column_ids = [int(c.split('|')[0]) for c in columns if '|' in c]
    return list(AdministrationAttribute.objects.filter(id__in=column_ids))


def validate_level_headers(levels, headers, excel_cols):
    level_keys = [(lvl.id, lvl.name) for lvl in levels]
    errors = []
    for idx, key in enumerate(level_keys):
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


def validate_attribute_headers(attributes, headers, excel_cols):
    if not headers:
        return [], {}
    attribute_key_map = {(att.id, att.name): att for att in attributes}
    errors = []
    results = OrderedDict()
    for idx, col in enumerate(excel_cols):
        default_error = {'error': ExcelError.header, 'cell': f"{col}1"}
        header = headers[idx]
        if '|' not in header:
            default_error.update({
                'error_message': ValidationText.header_invalid_attribute.value
            })
            errors.append(default_error)
            continue
        header_id, header_name = header.split('|')[:2]
        key = (int(header_id), header_name)
        if key not in attribute_key_map.keys():
            default_error.update({
                'error_message': ValidationText.header_invalid_attribute.value
            })
            errors.append(default_error)
            continue
        attribute = attribute_key_map[key]
        if attribute.type == AdministrationAttribute.Type.AGGREGATE:
            splits = header.split('|')
            if len(splits) != 3:
                default_error.update({
                    'error_message':
                        ValidationText.header_invalid_attribute.value
                })
                errors.append(default_error)
                continue
            opt = splits[-1]
            if opt not in attribute.options:
                default_error.update({
                    'error_message':
                        ValidationText.header_invalid_attribute.value
                })
                errors.append(default_error)
                continue
        results[header] = {'attribute': attribute_key_map[key], 'col': col}
    return errors, results
