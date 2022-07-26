#!/usr/bin/env bash

echo "Seed Administration? [y/n]"
read -r seed_administration
if [[ "${seed_administration}" == 'y' || "${seed_administration}" == 'Y' ]]; then
    python manage.py administration_seeder
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
    python manage.py fake_user_seeder --repeat 50
fi

echo "Seed Form? [y/n]"
read -r seed_form
if [[ "${seed_form}" == 'y' || "${seed_form}" == 'Y' ]]; then
    python manage.py form_seeder
    echo "Seeding Demo Approval Flow"
    python manage.py demo_approval_flow
    echo "Seeding Fake Pending Data Seeder"
    python manage.py fake_pending_data_seeder
    python manage.py generate_config
fi

echo "Seed Fake Data? [y/n]"
read -r seed_fake_data
if [[ "${seed_fake_data}" == 'y' || "${seed_fake_data}" == 'Y' ]]; then
    python manage.py fake_data_seeder
fi

# python manage.py fake_approver_seeder
# python manage.py form_approval_seeder
# python manage.py form_approval_assignment_seeder
# python manage.py fake_data_seeder
