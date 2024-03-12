import pandas as pd
import numpy as np
from django.core.management import BaseCommand
from utils.db_manager import reset_table_sequence
from api.v1.v1_profile.constants import OrganisationTypes
from api.v1.v1_users.models import Organisation, OrganisationAttribute

source_file = './source/organisation.csv'


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("-c",
                            "--clean",
                            nargs="?",
                            const=1,
                            default=False,
                            type=int)
        parser.add_argument(
            "-vv", "--verbose", nargs="?", const=1, default=False, type=int
        )
        parser.add_argument(
            "-t", "--test", nargs="?", const=1, default=False, type=int
        )

    def handle(self, *args, **options):
        clean = options.get("clean")
        test = options.get("test")
        verbose = options.get("verbose")
        if clean:
            Organisation.objects.all().delete()
            self.stdout.write('-- Organisation Cleared')
        df = pd.read_csv(source_file)
        df = df.replace({np.nan: None})
        for org in df.to_dict("records"):
            name = org["name"]
            abbrv = org.get("abbrv")
            types = org.get("types").split(",")
            if abbrv:
                name += f" ({abbrv})"
            organisation = Organisation.objects.filter(pk=org["id"]).first()
            if not organisation:
                organisation = Organisation(id=org.get("id"), name=name)
                if verbose:
                    print(f"ADDED: {name}")
            if organisation:
                if organisation.name != name:
                    if verbose:
                        print(f"UPDATED: {organisation.name} -> {name}")
                    organisation.name = name
            organisation.save()
            for tp in types:
                org_type = getattr(OrganisationTypes, tp.strip())
                if not OrganisationAttribute.objects.filter(
                        organisation=organisation, type=org_type).first():
                    attr = OrganisationAttribute(organisation=organisation,
                                                 type=org_type)
                    attr.save()
        reset_table_sequence('organisation')
        if not test:
            self.stdout.write("-- FINISH")
