import os
import sqlite3
import pandas as pd
from rtmis.settings import MASTER_DATA


def generate_sqlite(objects):
    objects = objects.objects.all()
    table_name = objects.model._meta.db_table
    file_name = f"{MASTER_DATA}/{table_name}.sqlite"
    if os.path.exists(file_name):
        os.remove(file_name)
    data = pd.DataFrame(list(objects.values()))
    if "parent_id" not in data.columns:
        data["parent_id"] = 0
    data["parent"] = data["parent_id"].apply(lambda x: int(x) if x == x else 0)
    data = data[["id", "name", "parent"]]
    conn = sqlite3.connect(file_name)
    data.to_sql('nodes', conn, if_exists='replace', index=False)
    return conn, file_name
