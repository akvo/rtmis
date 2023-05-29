import os
import json
from django.core.management import BaseCommand
from django.db import connection


def drop_schema():
    with connection.cursor() as cursor:
        cursor.execute(
            """
                SELECT EXISTS(
                SELECT relname FROM pg_class
                WHERE relkind = 'm' AND relname = %s)
                """,
            ["data_category"],
        )
        exists = cursor.fetchone()[0]
        if exists:
            cursor.execute("DROP MATERIALIZED VIEW data_category;")


def get_question_config(config: dict, cl: list):
    for q in config.get("questions"):
        cl.append(str(q["id"]))
        if q.get("other"):
            for o in q.get("other"):
                cl = get_question_config(config=o, cl=cl)
    return cl


def generate_schema() -> str:
    file_config = open("./source/config/category.json")
    configs = json.load(file_config)
    file_config.close()
    if len(configs) == 0:
        return ""

    mview = "CREATE MATERIALIZED VIEW data_category AS\n"
    mview += "SELECT ROW_NUMBER() OVER (PARTITION BY TRUE) as id, *\n"
    mview += "FROM (\n"
    for main_union, config in enumerate(configs):
        question_config = []
        for c in config["categories"]:
            question_config = get_question_config(config=c, cl=question_config)
        ql = ",".join(question_config)
        mview += (
            f"SELECT q.form_id, a.data_id, '{config['name']}' as name,"
            " jsonb_object_agg(a.question_id,COALESCE(a.options,"
            " to_jsonb(array[a.value]))) as options \n"
        )
        mview += "FROM answer a \n"
        mview += "LEFT JOIN question q ON q.id = a.question_id \n"
        mview += "WHERE (a.value IS NOT NULL OR a.options IS NOT NULL) \n"
        mview += f"AND q.id IN ({ql}) GROUP BY q.form_id, a.data_id\n"
        if main_union < len(configs) - 1:
            mview += " UNION "
    mview += ") as categories;"
    return mview


def category_json_availability(apps, schema_editor):
    if os.path.exists("./source/config/category.json"):
        return [("v1_categories", "category_json_is_available")]
    else:
        return []


class Command(BaseCommand):
    def handle(self, *args, **options):
        try:
            views = generate_schema()
            drop_schema()
            with connection.cursor() as cursor:
                cursor.execute(views)
        except FileNotFoundError:
            print("./source/category.json is not exist")
