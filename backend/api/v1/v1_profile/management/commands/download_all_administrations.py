import os
from django.core.management import BaseCommand

import pandas as pd
from api.v1.v1_profile.models import Administration, Levels
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
        levels = Levels.objects.filter(id__gt=1).all()
        for level in levels:
            col_name = f"{level.name.lower()}_id"
            df[col_name] = pd.to_numeric(df[col_name], errors='coerce')
            df[col_name] = df[col_name] \
                .where(df[col_name].notna(), None).astype('Int64')
        df.to_csv(file_path, index=False)
        url = upload(file=file_path, folder="master_data")
        self.stdout.write(f"File Created: {url}")
