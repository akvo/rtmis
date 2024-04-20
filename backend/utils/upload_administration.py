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
)

from api.v1.v1_users.models import SystemUser
from utils.storage import upload


def generate_template(
    filepath,
    attributes: List[int] = [],
):
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


def generate_excel(
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
    job_result: str,
    attributes: List[int] = [],
    level: int = None,
    adm_id: int = None,
):
    file_path = "./tmp/{0}".format(job_result.replace("/", "_"))
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
    administrations = Administration.objects.filter(
        Q(path__contains=adm_id) | Q(pk=adm_id)
    ).all()
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
