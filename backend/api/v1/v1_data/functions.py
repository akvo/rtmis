from django.db import transaction, connection


@transaction.atomic
def refresh_materialized_data():
    with connection.cursor() as cursor:
        cursor.execute("""
            REFRESH MATERIALIZED VIEW CONCURRENTLY view_data_options;""")
