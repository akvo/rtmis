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

echo "Seed Fake User? [y/n]"
read -r fake_user
if [[ "${fake_user}" == 'y' || "${fake_user}" == 'Y' ]]; then
    echo "Creating User for Admin with email admin@akvo.org"
    python manage.py createsuperuser \
        --email admin@akvo.org --first_name Admin --last_name One
    python manage.py assign_access admin@akvo.org --admin
    # python manage.py fake_user_seeder --repeat 50
fi

echo "Seed Form? [y/n]"
read -r seed_form
if [[ "${seed_form}" == 'y' || "${seed_form}" == 'Y' ]]; then
    python manage.py form_seeder
    python manage.py generate_config
fi

echo "Seed Fake Data? [y/n]"
read -r seed_fake_data
if [[ "${seed_fake_data}" == 'y' || "${seed_fake_data}" == 'Y' ]]; then
    python manage.py fake_data_seeder
fi

echo "Seed Fake Data Claim? [y/n]"
read -r seed_fake_data_claim
if [[ "${seed_fake_data_claim}" == 'y' || "${seed_fake_data_claim}" == 'Y' ]]; then
    python manage.py fake_data_claim_seeder
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
