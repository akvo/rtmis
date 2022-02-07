#!/usr/bin/env bash
# shellcheck disable=SC2155

python manage.py migrate
python manage.py administration_seeder
python manage.py runserver
