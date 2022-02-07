#!/usr/bin/env bash
# shellcheck disable=SC2155

# python manage.py migrate
# python manage.py administration_seeder
gunicorn --bind 0.0.0.0:8000 rtmis.wsgi:application
