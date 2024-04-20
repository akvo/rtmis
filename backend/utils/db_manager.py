from django.db import connections
from django.db.utils import ProgrammingError


def reset_table_sequence(table: str):
    query = f"SELECT setval('{table}_id_seq', (SELECT MAX(id) FROM {table}))"
    cursor = connections["default"].cursor()
    try:
        cursor.execute(query)
        row = cursor.fetchone()
        print(f"LAST SEQUENCE {table} ID: {row[0]}")
    except ProgrammingError:
        print(f"ERROR: TABLE {table} NOT FOUND")
