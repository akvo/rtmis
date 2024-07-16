#!/usr/bin/env bash

echo "Seed Administration? [y/n]"
read -r seed_administration
if [[ "${seed_administration}" == 'y' || "${seed_administration}" == 'Y' ]]; then
    python manage.py administration_seeder
    python manage.py resetsequence v1_profile
fi

echo "Add New Super Admin? [y/n]"
read -r add_account
if [[ "${add_account}" == 'y' || "${add_account}" == 'Y' ]]; then
    echo "Please type email address"
    read -r email_address
    if [[ "${email_address}" != '' ]]; then
        python manage.py createsuperuser --email "${email_address}"
        python manage.py assign_access "${email_address}"
    fi
fi

echo "Seed Form? [y/n]"
read -r seed_form
if [[ "${seed_form}" == 'y' || "${seed_form}" == 'Y' ]]; then
    python manage.py form_seeder
    python manage.py generate_config
fi

echo "Seed Organisation? [y/n]"
read -r seed_organization
if [[ "${seed_organization}" == 'y' || "${seed_organization}" == 'Y' ]]; then
    python manage.py organisation_seeder
fi

echo "Seed Entities? [y/n]"
read -r seed_entities
if [[ "${seed_entities}" == 'y' || "${seed_entities}" == 'Y' ]]; then
    python manage.py entities_seeder
fi

echo "Seed Administration Attribute? [y/n]"
read -r seed_administration_attribute
if [[ "${seed_administration_attribute}" == 'y' || "${seed_administration_attribute}" == 'Y' ]]; then
    python manage.py administration_attribute_seeder
fi

python manage.py generate_sqlite

# python manage.py fake_approver_seeder
# python manage.py fake_data_seeder
