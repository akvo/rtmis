from django.core.management import BaseCommand
from api.v1.v1_profile.models import (
    Administration,
    AdministrationAttribute,
    AdministrationAttributeValue,
    Levels,
)
from api.v1.v1_mobile.models import MobileAssignment
from faker import Faker
from typing import List

fake = Faker()


def seed_administration_attribute(self, test: bool):
    attribute_types = ["value", "option", "multiple_option", "aggregate"]
    for at in attribute_types:
        name = "Population"
        options = []
        if at == "option":
            name = "Urban or Rural"
            options = ["Urban", "Rural"]
        if at == "multiple_option":
            name = "Primary Occupations"
            options = ["Agriculture", "Livestock Farming", "Tourism"]
        if at == "aggregate":
            name = "Education"
            options = ["Primary", "Secondary", "Higher"]
        if not test:
            self.stdout.write(name)
        AdministrationAttribute.objects.create(
            name=name, type=at, options=options
        )


def seed_administration_attribute_value(
    self,
    adm_attributes: List[AdministrationAttribute],
    administration: Administration,
    test: bool,
):
    for adm_attr in adm_attributes:
        value = fake.random_int(min=50, max=500)
        if adm_attr.type in ["option", "multiple_option", "aggregate"]:
            value = fake.random_choices(
                elements=adm_attr.options,
                length=(
                    fake.random_int(min=1, max=len(adm_attr.options))
                    if adm_attr.type == "multiple_option"
                    else 1
                ),
            )
        value = {"value": value}
        if not test:
            self.stdout.write(f"{administration.name} - {adm_attr.name}")
        AdministrationAttributeValue.objects.create(
            administration=administration, attribute=adm_attr, value=value
        )


def seed_data(self, repeat: int = 2, test: bool = False):
    adm_attributes = AdministrationAttribute.objects.all()
    mobile_assignments = MobileAssignment.objects.prefetch_related(
        "administrations", "certifications"
    ).all()
    adms = [
        adm
        for m in mobile_assignments
        for adm in [a for a in m.administrations.all()]
        + [c for c in m.certifications.all()]
    ]
    for adm in adms:
        seed_administration_attribute_value(
            self, adm_attributes=adm_attributes, administration=adm, test=test
        )
    if len(adms) == 0:
        # Generate randomly
        last_level = Levels.objects.order_by("-id").first()
        randoms = Administration.objects.filter(level=last_level).order_by(
            "?"
        )[:repeat]
        for r in randoms:
            seed_administration_attribute_value(
                self,
                adm_attributes=adm_attributes,
                administration=r,
                test=test,
            )


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "-t", "--test", nargs="?", const=False, default=False, type=bool
        )
        parser.add_argument(
            "-r", "--repeat", nargs="?", const=3, default=3, type=int
        )
        parser.add_argument(
            "-c", "--clean", nargs="?", const=1, default=False, type=int
        )

    def handle(self, *args, **options):
        test = options.get("test")
        repeat = options.get("repeat")
        clean = options.get("clean")
        if clean:
            AdministrationAttributeValue.objects.all().delete()
            self.stdout.write("-- Administration attribute value Cleared")
            AdministrationAttribute.objects.all().delete()
            self.stdout.write("-- Administration attribute Cleared")
        else:
            seed_administration_attribute(self, test=test)
            seed_data(self, repeat=repeat, test=test)
        if not test:
            self.stdout.write("-- FINISH")
