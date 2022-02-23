#!/usr/bin/env bash

if [[ $# -eq 0 ]]; then
    echo "You need to add email address"
    exit
fi

python manage.py administration_seeder
python manage.py createsuperuser --email "$@"
python manage.py assign_access "$@"
python manage.py form_seeder
python manage.py fake_data_seeder
python manage.py fake_user_seeder --repeat 20
python manage.py form_approval_seeder
python manage.py generate_config
