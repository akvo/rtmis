import os
import pandas as pd
from typing import List
from api.v1.v1_profile.models import (
    Administration, Levels,
    Entity, EntityData
)
from utils.storage import upload


def generate_list_of_entities(
    file_path: str,
    entity_ids: List[int] = [],
    adm_id: int = None
):
    file_path = './tmp/{0}'.format(file_path.replace("/", "_"))
    if os.path.exists(file_path):
        os.remove(file_path)

    levels = Levels.objects.order_by("level").values("name")
    writer = pd.ExcelWriter(file_path, engine='xlsxwriter')
    entity_filter = Entity.objects.all()
    if entity_ids:
        entity_filter = Entity.objects.filter(id__in=entity_ids)
    for entity in entity_filter:
        entities = []
        filter_entity_data = EntityData.objects.filter(
            entity=entity,
        )
        if adm_id:
            administration = Administration.objects.get(id=adm_id)
            if administration.path:
                administration_path = administration.path + str(
                    administration.id
                ) + "."
            else:
                administration_path = str(administration.id) + "."
            filter_entity_data = filter_entity_data.filter(
                administration__path__startswith=administration_path
            )
            # includes the administration itself
            filter_entity_data |= EntityData.objects.filter(
                administration=administration
            )
        for entity_data in filter_entity_data:
            administrations = entity_data.administration.full_path_name.split(
                "|"
            )
            entity_object = {
                "Name": entity_data.name,
                "Code": entity_data.code,
            }
            for i, level in enumerate(levels):
                if i < len(administrations):
                    entity_object[levels[i]["name"]] = administrations[i]
                else:
                    entity_object[levels[i]["name"]] = ""
            entities.append(entity_object)
        df = pd.DataFrame(entities)
        df.to_excel(
            writer,
            sheet_name=entity.name,
            index=False
        )
    writer.save()
    url = upload(file=file_path, folder='download_entities')
    return url
