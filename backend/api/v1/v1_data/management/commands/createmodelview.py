from django.core.management import BaseCommand
from django.db import connection

from api.v1.v1_data.models import ViewPendingDataApproval


class Command(BaseCommand):

    def handle(self, *args, **options):
        target = ViewPendingDataApproval()
        table = target._meta.db_table
        query = target.get_query()

        with connection.cursor() as cursor:
            self.drop(cursor, table)
            self.create(cursor, table, query)

    def drop(self, cursor, table):
        cursor.execute("DROP VIEW IF EXISTS {};".format(table))

    def create(self, cursor, table, query):
        cursor.execute(
            "CREATE VIEW {table} AS {query};".format(table=table, query=query)
        )
