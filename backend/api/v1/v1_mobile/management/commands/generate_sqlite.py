from django.core.management import BaseCommand
from utils.custom_generator import generate_sqlite
from api.v1.v1_profile.models import Administration
from api.v1.v1_users.models import Organisation


class Command(BaseCommand):

    def handle(self, *args, **options):
        conn, file = generate_sqlite(Administration)
        print(f"{file} Generated Successfully")
        conn.close()
        conn, file = generate_sqlite(Organisation)
        print(f"{file} Generated Successfully")
        conn.close()
