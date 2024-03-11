import pandas as pd
from api.v1.v1_profile.models import Entity, Levels, EntityData


def generate_list_of_entities(file_path, entity_id=[]):
    levels = Levels.objects.order_by("level").values("name")
    writer = pd.ExcelWriter(file_path, engine='xlsxwriter')
    entity_filter = Entity.objects.all()
    if entity_id:
        entity_filter = Entity.objects.filter(id__in=entity_id)
    for entity in entity_filter:
        entities = []
        for entity_data in EntityData.objects.filter(entity=entity):
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
