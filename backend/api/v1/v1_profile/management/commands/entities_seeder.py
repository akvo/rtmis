import random
from django.core.management import BaseCommand
from django.core.management import call_command
from api.v1.v1_profile.models import Administration, Entity, EntityData
from faker import Faker

fake = Faker()


def get_entity_type(name: str):
    entity, _ = Entity.objects.get_or_create(name=name)
    return entity


def seed_data(self, repeat: int = 3, test: bool = False):
    entity_types = ["School", "Health Care Facilities"]
    wards = Administration.objects.filter(level=4).all()
    ward = random.choice(wards)
    if ward:
        if not test:
            self.stdout.write(f"WARD: {ward.full_path_name}")
        random_type = random.choice(entity_types)
        entity_type = get_entity_type(name=random_type)
        EntityData.objects.create(
            name=f"{random_type} - {fake.company()}- {ward.name}",
            administration=ward,
            entity=entity_type
        )
        villages = Administration.objects.filter(parent=ward.id)
        for row in range(repeat):
            village = random.choice(villages)
            entities = []
            if not test:
                self.stdout.write(f"SEEDING - {village.name}")
            for i in range(repeat):
                find_type = random.choice(entity_types)
                entity_type = get_entity_type(name=find_type)
                ename = f"{entity_type.name} - {fake.company()} {row}{i+1}"
                self.stdout.write(ename)
                entities.append({
                    'entity': entity_type,
                    'name': ename
                })
                EntityData.objects.create(
                    name=ename,
                    administration=village,
                    entity=entity_type
                )


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "-t",
            "--test",
            nargs="?",
            const=False,
            default=False,
            type=bool
        )
        parser.add_argument(
            "-r",
            "--repeat",
            nargs="?",
            const=3,
            default=3,
            type=int
        )
        parser.add_argument(
            "-c",
            "--clean",
            nargs="?",
            const=1,
            default=False,
            type=int
        )

    def handle(self, *args, **options):
        test = options.get("test")
        repeat = options.get("repeat")
        clean = options.get("clean")
        if clean:
            EntityData.objects.all().delete()
            Entity.objects.all().delete()
            self.stdout.write("-- Entities Cleared")
        else:
            seed_data(self, repeat=repeat, test=test)
            self.stdout.write("-- FINISH")
        if not test:
            call_command("generate_sqlite")
