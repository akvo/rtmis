from django.core.management import BaseCommand
from api.v1.v1_categories.functions import refresh_data_category_views


class Command(BaseCommand):
    def handle(self, *args, **options):
        refresh_data_category_views()
