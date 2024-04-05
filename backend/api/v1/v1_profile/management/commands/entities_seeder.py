from django.core.management import BaseCommand
from django.core.management import call_command
from api.v1.v1_profile.models import (
    Administration, Entity, EntityData, SystemUser, Levels
)
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_forms.models import Forms
from api.v1.v1_mobile.models import MobileAssignment
from faker import Faker

fake = Faker()


def create_entity_data(self, administration: Administration, test: bool):
    entity_types = ["School", "Health Care Facilities"]
    for t in entity_types:
        entity, created = Entity.objects.get_or_create(name=t)
        name = f"{entity.name} - {fake.company()}" \
            if created else f"{t} - {fake.company()}"
        if not test:
            self.stdout.write(name)
        EntityData.objects.create(
            name=name,
            administration=administration,
            entity=entity
        )


def seed_data(self, repeat: int = 3, test: bool = False):
    mobile_assignments = MobileAssignment.objects.prefetch_related(
        'administrations', 'certifications'
    ).all()
    adms = [
        adm
        for m in mobile_assignments
        for adm in [a for a in m.administrations.all()] +
        [c for c in m.certifications.all()]
    ]
    for adm in adms:
        create_entity_data(
            self,
            administration=adm,
            test=test
        )
    entity_form = Forms.objects.filter(
        form_question_group__question_group_question__extra__contains="entity"
    ).order_by('?').first()
    users = SystemUser.objects.filter(
        user_access__role=UserRoleTypes.user,
        user_form__form=entity_form
    ).order_by('?')[:repeat]
    for user in users:
        path = f"{user.user_access.administration.path}"
        path += f"{user.user_access.administration.id}"
        village = Administration.objects.filter(
            path__startswith=path
        ).order_by('?').first()
        create_entity_data(
            self,
            administration=village,
            test=test
        )
    if len(users) == 0 and len(adms) == 0:
        # Generate randomly
        last_level = Levels.objects.order_by('-id').first()
        randoms = Administration.objects.filter(
            level=last_level
        ).order_by('?')[:repeat]
        for r in randoms:
            create_entity_data(
                self,
                administration=r,
                test=test
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
        if not test:
            self.stdout.write("-- FINISH")
            call_command("generate_sqlite")
