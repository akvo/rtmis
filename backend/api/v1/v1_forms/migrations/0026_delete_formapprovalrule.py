# Generated by Django 4.0.4 on 2024-02-08 07:36

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('v1_forms', '0025_questions_meta_uuid'),
    ]

    operations = [
        migrations.DeleteModel(
            name='FormApprovalRule',
        ),
    ]