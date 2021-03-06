# Generated by Django 4.0.2 on 2022-04-05 07:29

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('v1_data', '0012_pendingdatabatchcomments'),
    ]

    operations = [
        migrations.AlterField(
            model_name='answerhistory',
            name='created_by',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='answer_history_created',
                to=settings.AUTH_USER_MODEL),
        ),
    ]
