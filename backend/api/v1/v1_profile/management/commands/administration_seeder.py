import pandas as pd
from django.core.management import BaseCommand

from api.v1.v1_profile.models import Administration


class Command(BaseCommand):

    def handle(self, *args, **options):
        df = pd.read_csv('api/v1/v1_profile/management/commands/kenya.csv',
                         header=0, skip_blank_lines=True)
        print('Skipping header and blank lines')
        for index, row in df.iterrows():
            print('Executing index {0}'.format(index))
            if len(row.values) == 3:
                print(row.values)
                lvl1, lvl1_created = Administration.objects.get_or_create(
                    name=row.get(0), level=1)
                lvl2, lvl2_created = Administration.objects.get_or_create(
                    name=row.get(1), level=2)
                if lvl2_created:
                    lvl2.parent = lvl1
                    lvl2.save()
                lvl3, lvl3_created = Administration.objects.get_or_create(
                    name=row.get(2), level=3)
                lvl3.parent = lvl2
                lvl3.save()
        print('Data uploaded')
