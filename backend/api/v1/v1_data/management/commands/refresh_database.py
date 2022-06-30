from django.core.management import BaseCommand
from api.v1.v1_data.functions import refresh_materialized_data


class Command(BaseCommand):
    def handle(self, *args, **options):
        refresh_materialized_data()
