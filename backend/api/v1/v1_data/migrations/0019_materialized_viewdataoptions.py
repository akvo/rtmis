# Generated by Django 4.0.4 on 2022-06-30 20:05

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('v1_data', '0018_alter_pendinganswerhistory_created_by_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            """
            DROP VIEW view_data_options;
            CREATE MATERIALIZED VIEW view_data_options as
                SELECT
                    row_number() over (partition by true) as id,
                    tmp.data_id,
                    d.administration_id,
                    d.form_id,
                    to_jsonb(array_agg(
                        concat(tmp.question_id, '||',
                            lower(tmp.options::text))
                    )) as options
                FROM (
                    SELECT
                        a.data_id,
                        a.question_id,
                        a.id as answer_id,
                        jsonb_array_elements_text(a.options) as options
                    FROM answer a LEFT JOIN question q on q.id = a.question_id
                    WHERE q.type = 5  or q.type = 6
                ) tmp
                LEFT JOIN data d ON d.id = tmp.data_id
                GROUP BY tmp.data_id, d.administration_id, d.form_id
            """,
            """
            DROP MATERIALIZED VIEW view_data_options;
            CREATE VIEW view_data_options as
                SELECT
                    row_number() over (partition by true) as id,
                    tmp.data_id,
                    d.administration_id,
                    d.form_id,
                    to_jsonb(array_agg(
                        concat(tmp.question_id, '||',
                            lower(tmp.options::text))
                    )) as options
                FROM (
                    SELECT
                        a.data_id,
                        a.question_id,
                        a.id as answer_id,
                        jsonb_array_elements_text(a.options) as options
                    FROM answer a LEFT JOIN question q on q.id = a.question_id
                    WHERE q.type = 5  or q.type = 6
                ) tmp
                LEFT JOIN data d ON d.id = tmp.data_id
                GROUP BY tmp.data_id, d.administration_id, d.form_id
            """
            )
    ]
