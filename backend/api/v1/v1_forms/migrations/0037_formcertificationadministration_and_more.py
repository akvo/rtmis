# Generated by Django 4.0.4 on 2024-04-01 02:49

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('v1_profile', '0015_alter_entitydata_administration_and_more'),
        ('v1_forms', '0036_forms_submission_types'),
    ]

    operations = [
        migrations.CreateModel(
            name='FormCertificationAdministration',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('administration', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='v1_profile.administration')),
            ],
            options={
                'db_table': 'form_certification_administration',
            },
        ),
        migrations.CreateModel(
            name='FormCertificationAssignment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('updated', models.DateTimeField(auto_now_add=True)),
                ('administrations', models.ManyToManyField(related_name='certification_administrations', through='v1_forms.FormCertificationAdministration', to='v1_profile.administration')),
                ('assignee', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='certification_assignee', to='v1_profile.administration')),
            ],
            options={
                'db_table': 'form_certification_assignment',
            },
        ),
        migrations.AddField(
            model_name='formcertificationadministration',
            name='assignment',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='v1_forms.formcertificationassignment'),
        ),
        migrations.AlterUniqueTogether(
            name='formcertificationadministration',
            unique_together={('assignment', 'administration')},
        ),
    ]
