#!/usr/bin/env bash
# shellcheck disable=SC2155

set -eu

python manage.py migrate
python manage.py generate_config

gunicorn rtmis.wsgi --max-requests 200 --workers 6 --timeout 300 --bind 0.0.0.0:8000
