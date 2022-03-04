#!/usr/bin/env bash

if [[ $# -eq 0 ]]; then
    echo "You need to add email address"
    echo "Example Usage: ./seeder.sh youremail@akvo.org"
    exit
fi

python manage.py administration_seeder
echo "Creating User for Super Admin with email" "$@"
python manage.py createsuperuser --email "$@"
python manage.py assign_access "$@"
python manage.py form_seeder
echo "Creating User for Admin with email admin@akvo.org"
python manage.py createsuperuser --email admin@akvo.org --first_name Admin --last_name One
python manage.py assign_access admin@akvo.org --admin
python manage.py fake_user_seeder --repeat 50
python manage.py fake_approver_seeder
python manage.py form_approval_seeder
python manage.py form_approval_assignment_seeder
python manage.py fake_pending_data_seeder
python manage.py generate_config
python manage.py fake_data_seeder
