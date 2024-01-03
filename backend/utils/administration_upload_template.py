import os
from typing import List
from django.utils import timezone

import pandas as pd
from api.v1.v1_profile.models import (
    Levels,
    AdministrationAttribute,
    Administration
)

from api.v1.v1_users.models import SystemUser


def generate_excel(
    user: SystemUser,
    attributes: List[int] = [],
    level: int = None
):
    directory = 'tmp/administrations-template'
    os.makedirs(directory, exist_ok=True)
    filename = (
            f"{timezone.now().strftime('%Y%m%d%H%M%S')}-{user.pk}-"
            "administrations-template.xlsx")
    filepath = f"./{directory}/{filename}"
    if os.path.exists(filepath):
        os.remove(filepath)
    generate_template(filepath, attributes, level)
    return filepath


def generate_template(filepath, attributes: List[int] = [], level: int = None):
    level_header = [
            f'{lvl.id}|{lvl.name}' for lvl
            in Levels.objects.order_by('level').all()]
    attribute_header = [
            f'{att.id}|{att.name}' for att
            in AdministrationAttribute.objects.filter(
                id__in=attributes).order_by('id')]
    columns = level_header + attribute_header
    data = pd.DataFrame(columns=columns, index=[0])
    writer = pd.ExcelWriter(filepath, engine='xlsxwriter')
    data.to_excel(
            writer,
            sheet_name='data',
            startrow=1,
            header=False,
            index=False)
    workbook = writer.book
    worksheet = writer.sheets['data']
    header_format = workbook.add_format({
        'bold': True,
        'text_wrap': True,
        'valign': 'top',
        'border': 1
    })
    for col_num, value in enumerate(data.columns.values):
        worksheet.write(0, col_num, value, header_format)
    # get administrations list
    administrations = Administration.objects
    if level:
        administrations = administrations.filter(level_id__lte=level)
    administrations = administrations.all()
    for adx, adm in enumerate(administrations):
        find_col = next((
            lx for lx, lvl in enumerate(level_header)
            if str(adm.level_id) in lvl
        ), -1)
        if find_col >= 0:
            worksheet.write(adx + 1, find_col, adm.name)
        if adm.path:
            adm_parents = [
                list(filter(lambda item: item.id == int(p), administrations))
                for p in list(filter(
                    lambda path: path, adm.path.split(".")
                ))
            ]
            for parent_col, pl in enumerate(adm_parents):
                [parent] = pl
                worksheet.write(adx + 1, parent_col, parent.name)
    writer.save()
