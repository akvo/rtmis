# Generated by Django 4.0.4 on 2024-01-04 00:46

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('v1_data', '0025_alter_formdata_administration_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='pendingformdata',
            name='deleted',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]