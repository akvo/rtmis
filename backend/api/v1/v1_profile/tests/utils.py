from api.v1.v1_profile.management.commands.administration_seeder import (
        seed_levels)
from api.v1.v1_profile.models import Administration, Entity, EntityData, Levels


class AdministrationEntitiesTestFactory:
    def __init__(self, data):
        self.data = data

    def populate(self):
        seed_levels()
        self.make_objects(
            name=self.data['name'],
            children=self.data.get('children'),
        )

    def make_objects(
            self, name, entities=[], children=[], parent=None, depth=0):
        level = Levels.objects.get(level=depth)
        administration = Administration.objects.create(
            name=name,
            parent=parent,
            level=level,
        )
        for data in entities:
            entity, _ = Entity.objects.get_or_create(name=data['entity'])
            EntityData.objects.create(
                name=data['name'],
                administration=administration,
                entity=entity
            )
        for child in children:
            self.make_objects(
                name=child['name'],
                entities=child.get('entities', []),
                children=child.get('children', []),
                parent=administration,
                depth=depth+1
            )
