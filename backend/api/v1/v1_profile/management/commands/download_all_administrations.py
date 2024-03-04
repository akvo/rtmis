import os
from django.core.management import BaseCommand

import pandas as pd
from api.v1.v1_profile.models import Administration
from utils.storage import upload


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "-t",
            "--test",
            nargs="?",
            const=1,
            default=False,
            type=int
        )

    def handle(self, *args, **options):
        test = options.get("test")
        filename = "kenya-administration.csv"
        if test:
            filename = "kenya-administration_test.csv"
        file_path = './tmp/{0}'.format(filename)
        if os.path.exists(file_path):
            os.remove(file_path)
        administrations = Administration.objects.filter(level__id__gt=1).all()
        data = []
        for adm in administrations:
            columns = {}
            if adm.path:
                parent_ids = list(filter(
                    lambda path: path, adm.path.split(".")
                ))
                parents = Administration.objects.filter(
                    pk__in=parent_ids,
                    level__id__gt=1
                ).all()
                for p in parents:
                    columns[p.level.name.lower()] = p.name
                    columns[f"{p.level.name.lower()}_id"] = p.id
            columns[adm.level.name.lower()] = adm.name
            columns[f"{adm.level.name.lower()}_id"] = adm.id
            data.append(columns)
        df = pd.DataFrame(data)
        df.to_csv(file_path, index=False)
        upload(file=file_path)
