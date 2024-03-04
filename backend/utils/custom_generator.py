import os
import sqlite3
import pandas as pd
import logging
from rtmis.settings import MASTER_DATA
from api.v1.v1_profile.models import Administration

logger = logging.getLogger(__name__)


def generate_sqlite(model):
    table_name = model._meta.db_table
    field_names = [f.name for f in model._meta.fields]
    objects = model.objects.all()
    file_name = f"{MASTER_DATA}/{table_name}.sqlite"
    if os.path.exists(file_name):
        os.remove(file_name)
    data = pd.DataFrame(list(objects.values(*field_names)))
    no_rows = data.shape[0]
    if no_rows < 1:
        return
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
    conn = sqlite3.connect(file_name)
    data.to_sql("nodes", conn, if_exists="replace", index=False)
    conn.close()
    return file_name


def update_sqlite(model, data, id=None):
    table_name = model._meta.db_table
    fields = data.keys()
    field_names = ', '.join([f for f in fields])
    placeholders = ', '.join(['?' for _ in range(len(fields))])
    update_placeholders = ', '.join([f"{f} = ?" for f in fields])
    params = list(data.values())
    if id:
        params += [id]
    file_name = f"{MASTER_DATA}/{table_name}.sqlite"
    conn = sqlite3.connect(file_name)
    try:
        with conn:
            c = conn.cursor()
            if id:
                c.execute("SELECT * FROM nodes WHERE id = ?", (id,))
                if c.fetchone():
                    query = f"UPDATE nodes \
                        SET {update_placeholders} WHERE id = ?"
                    c.execute(query, params)
            if not id:
                query = f"INSERT INTO nodes({field_names}) \
                    VALUES ({placeholders})"
                c.execute(query, params)
    except Exception as error:
        logger.error({
            'context': 'update_sqlite',
            'error': error,
            'table_name': table_name,
            'data': data,
            'id': id
        })
        conn.rollback()
    finally:
        conn.close()


def administration_csv_add(data: dict, test: bool = False):
    filepath = "./storage/kenya-administration.csv"
    if test:
        filepath = "./storage/kenya-administration_test.csv"
    if os.path.exists(filepath):
        df = pd.read_csv(filepath)
        new_data = {}
        if data.path:
            parent_ids = list(filter(
                lambda path: path, data.path.split(".")
            ))
            parents = Administration.objects.filter(
                pk__in=parent_ids,
                level__id__gt=1
            ).all()
            for p in parents:
                new_data[p.level.name.lower()] = p.name
                new_data[f"{p.level.name.lower()}_id"] = p.id
        new_data[data.level.name.lower()] = data.name
        new_data[f"{data.level.name.lower()}_id"] = data.id
        df = df.append(new_data, ignore_index=True)
        df.to_csv(filepath, index=False)
        return filepath
    else:
        logger.error({
            'context': 'insert_administration_row_csv',
            'message': "kenya-administration_test.csv doesn't exists"
        })
    return None


def get_index_values(df):
    last_values = []
    last_indices = []
    # Iterate over each row in the DataFrame
    for index, row in df.iterrows():
        # Find the last non-null value and its index
        last_non_null_index = row.last_valid_index()
        last_non_null_value = row[last_non_null_index]  
        # Append the last non-null value and its index to the lists
        last_values.append(last_non_null_value)
        last_indices.append(last_non_null_index)
    return last_values, last_indices


def administration_csv_update(data: dict, test: bool = False):
    filepath = "./storage/kenya-administration.csv"
    if test:
        filepath = "./storage/kenya-administration_test.csv"
    if os.path.exists(filepath):
        df = pd.read_csv(filepath)

        last_values, last_indices = get_index_values(df=df)
        # Print the last non-null value and its index for each row
        for value, index in zip(last_values, last_indices):
            if data.id == value:
                col_name = data.level.name.lower()
                df.at[index, col_name] = data.name
                df.at[index, f"{col_name}_id"] = data.id
        df.to_csv(filepath, index=False)
        return filepath
    else:
        logger.error({
            'context': 'update_administration_row_csv',
            'message': "kenya-administration_test.csv doesn't exists"
        })
    return None


def administration_csv_delete(id: int, test: bool = False):
    filepath = "./storage/kenya-administration.csv"
    if test:
        filepath = "./storage/kenya-administration_test.csv"
    if os.path.exists(filepath):
        df = pd.read_csv(filepath)

        last_values, last_indices = get_index_values(df=df)
        # Print the last non-null value and its index for each row
        for value, index in zip(last_values, last_indices):
            if id == value:
                df = df.drop(index=index)
        df.to_csv(filepath, index=False)
        return filepath
    else:
        logger.error({
            'context': 'delete_administration_row_csv',
            'message': "kenya-administration_test.csv doesn't exists"
        })
    return None
