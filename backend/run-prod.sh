#!/usr/bin/env bash
# shellcheck disable=SC2155

set -eu

python manage.py migrate
python manage.py generate_config

function log {
   echo "$(date +"%T") - START INFO - $*"
}

log Starting gunicorn
gunicorn rtmis.wsgi --bind 0.0.0.0:8000
