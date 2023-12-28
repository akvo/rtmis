import os
import sqlite3
import pandas as pd
from rtmis.settings import MASTER_DATA


def generate_sqlite(model):
    table_name = model._meta.db_table
    field_names = [f.name for f in model._meta.fields]
    objects = model.objects.all()
    file_name = f"{MASTER_DATA}/{table_name}.sqlite"
    if os.path.exists(file_name):
        os.remove(file_name)
    data = pd.DataFrame(list(objects.values(*field_names)))
    if "parent" in field_names:
        data["parent"] = data["parent"].apply(
            lambda x: int(x) if x == x else 0
        )
    elif "administration" in field_names:
        data["parent"] = data["administration"].apply(
            lambda x: int(x) if x == x else 0
        )
    else:
        data["parent"] = 0
    if objects.count() < 1:
        return
    conn = sqlite3.connect(file_name)
    data.to_sql("nodes", conn, if_exists="replace", index=False)
    conn.close()
    return file_name
