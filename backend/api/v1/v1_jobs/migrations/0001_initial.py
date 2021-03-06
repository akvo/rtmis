# Generated by Django 4.0.2 on 2022-03-22 06:25

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Jobs',
            fields=[
                ('id', models.CharField(max_length=50, primary_key=True,
                                        serialize=False, unique=True)),
                ('type', models.IntegerField(
                    choices=[(1, 'send_email'), (2, 'validate_data'),
                             (3, 'seed_data'), (4, 'download')])),
                ('status', models.IntegerField(
                    choices=[(1, 'pending'), (2, 'on_progress'), (3, 'failed'),
                             (4, 'done')], default=1)),
                ('attempt', models.IntegerField(default=0)),
                ('result', models.TextField(default=None, null=True)),
                ('info', models.JSONField(default=None, null=True)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('available', models.DateTimeField(default=None, null=True)),
                ('user',
                 models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                                   related_name='user_jobs',
                                   to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'jobs',
            },
        ),
    ]
