import os
from typing import List
from django.db.models import QuerySet
from django.utils import timezone
from django.db.models import Q

import pandas as pd
from api.v1.v1_profile.models import (
    Levels,
    AdministrationAttribute,
    Administration,
    Entity,
)

from api.v1.v1_users.models import SystemUser
from utils.storage import upload
from rtmis.settings import STORAGE_PATH


def generate_template(
    filepath,
    attributes: List[int] = [],
):
    level_headers = [
        col
        for lvl in Levels.objects.order_by('level').all()
        for col in [f'{lvl.id}|{lvl.name}', f'{lvl.id}|{lvl.name} Code']
    ]
    attribute_headers = generate_attribute_headers(
        AdministrationAttribute.objects.filter(id__in=attributes).order_by(
            "id"
        )
    )
    columns = level_headers + attribute_headers
    data = pd.DataFrame(columns=columns, index=[0])
    writer = pd.ExcelWriter(filepath, engine="xlsxwriter")
    data.to_excel(
        writer, sheet_name="data", startrow=1, header=False, index=False
    )
    workbook = writer.book
    worksheet = writer.sheets["data"]
    header_format = workbook.add_format(
        {"bold": True, "text_wrap": True, "valign": "top", "border": 1}
    )
    for col_num, value in enumerate(data.columns.values):
        worksheet.write(0, col_num, value, header_format)
    writer.save()


def generate_administration_excel(
    user: SystemUser,
    attributes: List[int] = [],
):
    directory = "tmp/administrations-template"
    os.makedirs(directory, exist_ok=True)
    filename = (
        f"{timezone.now().strftime('%Y%m%d%H%M%S')}-{user.pk}-"
        "administrations-template.xlsx"
    )
    filepath = f"./{directory}/{filename}"
    if os.path.exists(filepath):
        os.remove(filepath)
    generate_template(filepath=filepath, attributes=attributes)
    return filepath


def generate_administration_template(
    file_path: str,
    attributes: List[int] = [],
    level: int = None,
    adm_id: int = None,
):
    file_path = "./tmp/{0}".format(file_path.replace("/", "_"))
    if os.path.exists(file_path):
        os.remove(file_path)
    level_headers = [
        f"{lvl.id}|{lvl.name}"
        for lvl in Levels.objects.order_by("level").all()
    ]
    attribute_headers = generate_attribute_headers(
        AdministrationAttribute.objects.filter(id__in=attributes).order_by(
            "id"
        )
    )
    columns = level_headers + attribute_headers
    data = pd.DataFrame(columns=columns, index=[0])
    writer = pd.ExcelWriter(file_path, engine="xlsxwriter")
    data.to_excel(
        writer, sheet_name="data", startrow=1, header=False, index=False
    )
    workbook = writer.book
    worksheet = writer.sheets["data"]
    header_format = workbook.add_format(
        {"bold": True, "text_wrap": True, "valign": "top", "border": 1}
    )
    for col_num, value in enumerate(data.columns.values):
        worksheet.write(0, col_num, value, header_format)
    # get administrations with path
    filter_administration = Administration.objects.get(pk=adm_id)
    filter_path = f"{filter_administration.id}."
    if filter_administration.path:
        filter_path = "{0}{1}.".format(
            filter_administration.path, filter_administration.id
        )
    administrations = Administration.objects.filter(
        Q(path__startswith=filter_path) | Q(pk=adm_id)
    ).all()
    # EOL get administrations with path
    aggregate_type = AdministrationAttribute.Type.AGGREGATE
    multiple_type = AdministrationAttribute.Type.MULTIPLE_OPTION
    for adx, adm in enumerate(administrations):
        for cx, col in enumerate(columns):
            if cx < len(level_headers) and f"{adm.level_id}" in col:
                worksheet.write(adx + 1, cx, adm.name)
            if cx >= len(level_headers):
                attr_props = col.split("|")
                attr_id = attr_props[0]
                find_attr = adm.attributes.filter(
                    attribute__id=int(attr_id)
                ).first()
                if find_attr:
                    attr_value = find_attr.value
                    if find_attr.attribute.type == aggregate_type:
                        worksheet.write(
                            adx + 1, cx, attr_value.get("value")[attr_props[2]]
                        )
                    if find_attr.attribute.type == multiple_type:
                        worksheet.write(
                            adx + 1, cx, "|".join(attr_value.get("value"))
                        )
                    if find_attr.attribute.type in [
                        AdministrationAttribute.Type.VALUE,
                        AdministrationAttribute.Type.OPTION,
                    ]:
                        worksheet.write(adx + 1, cx, attr_value.get("value"))
        if adm.path:
            parent_ids = list(filter(lambda path: path, adm.path.split(".")))
            parents = Administration.objects.filter(pk__in=parent_ids).all()
            for parent_col, p in enumerate(parent_ids):
                [find_adm] = list(
                    filter(lambda path: path.id == int(p), parents)
                )
                if find_adm:
                    worksheet.write(adx + 1, parent_col, find_adm.name)
    writer.save()
    url = upload(file=file_path, folder="download_administration")
    return url


def generate_attribute_headers(
    attributes: QuerySet[AdministrationAttribute],
) -> List[str]:
    headers = []
    for attribute in attributes:
        if attribute.type == AdministrationAttribute.Type.AGGREGATE:
            headers = headers + generate_aggregate_attribute_headers(attribute)
        else:
            headers.append(f"{attribute.id}|{attribute.name}")
    return headers


def generate_aggregate_attribute_headers(
    attribute: AdministrationAttribute,
) -> List[str]:
    return [
        f"{attribute.id}|{attribute.name}|{opt}" for opt in attribute.options
    ]


def fill_administration_data(
    writer: pd.ExcelWriter,
    sheet_name: str,
    administration: Administration = None,
    testing: bool = False,
):
    filename = "kenya-administration.csv"
    if testing:
        filename = "kenya-administration_test.csv"
    source_file = "{0}/master_data/{1}".format(
        STORAGE_PATH,
        filename
    )

    # Read the CSV file into a DataFrame
    df = pd.read_csv(source_file)

    if administration:
        level_name = administration.level.name.lower()
        column_name = f"{level_name}_id"
        if column_name in df.columns:
            df = df[df[column_name] == administration.id]

    # Convert the filtered DataFrame to a list of dictionaries
    administrations = df.to_dict("records")

    worksheet = writer.sheets[sheet_name]
    level_names = list(Levels.objects.order_by("level").values_list(
        "name", flat=True
    ))
    national = Administration.objects.filter(
        level__level=0
    ).first()
    for adx, adm in enumerate(administrations):
        if national:
            worksheet.write(adx + 1, 2, national.name)
        for lx, level in enumerate(level_names):
            value = ""
            if level.lower() in adm:
                value = adm[level.lower()]
            if value == value:
                worksheet.write(adx + 1, lx + 2, value)


def generate_entities_template(
    filepath: str,
    entity_ids: List[int] = [],
    administration: Administration = None,
    prefilled: bool = False,
    testing: bool = False,
):
    level_names = Levels.objects.order_by("level").values_list(
        "name", flat=True
    )
    static_columns = ["Name", "Code"]
    columns = static_columns + list(level_names)

    df = pd.DataFrame(columns=columns, index=[0])
    entities = Entity.objects.all()
    if len(entity_ids):
        entities = Entity.objects.filter(pk__in=entity_ids).all()
    with pd.ExcelWriter(filepath, engine="xlsxwriter") as writer:
        for entity in entities:
            sheet_name = entity.name
            df.to_excel(writer, sheet_name=sheet_name, index=False)
            workbook = writer.book
            worksheet = writer.sheets[sheet_name]
            header_format = workbook.add_format(
                {"bold": True, "text_wrap": True, "valign": "top", "border": 1}
            )
            for col_num, value in enumerate(df.columns.values):
                worksheet.write(0, col_num, value, header_format)
            if prefilled:
                fill_administration_data(
                    writer=writer,
                    sheet_name=sheet_name,
                    administration=administration,
                    testing=testing,
                )


def generate_entities_data_excel(
    user: SystemUser,
    entity_ids: List[int] = [],
    administration: Administration = None,
    prefilled: bool = False,
    testing: bool = False,
):
    directory = "tmp/entities-data-template"
    os.makedirs(directory, exist_ok=True)
    filename = (
        f"{timezone.now().strftime('%Y%m%d%H%M%S')}-{user.pk}-"
        "entities-data-template.xlsx"
    )
    filepath = f"./{directory}/{filename}"
    if os.path.exists(filepath):
        os.remove(filepath)
    generate_entities_template(
        filepath=filepath,
        entity_ids=entity_ids,
        administration=administration,
        prefilled=prefilled,
        testing=testing,
    )
    return filepath
