# Generated by Django 4.0.4 on 2024-01-29 17:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('v1_jobs', '0002_jobs_task_id_alter_jobs_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='jobs',
            name='type',
            field=models.IntegerField(choices=[(1, 'send_email'), (2, 'validate_data'), (3, 'seed_data'), (4, 'download'), (5, 'download_administration')]),
        ),
    ]
