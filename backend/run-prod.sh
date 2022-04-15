#!/usr/bin/env bash
# shellcheck disable=SC2155

set -eu

python manage.py migrate
# python manage.py administration_seeder
# gunicorn rtmis.wsgi:application
python manage.py generate_config

function log {
   echo "$(date +"%T") - START INFO - $*"
}

_term() {
  echo "Caught SIGTERM signal!"
  kill -TERM "$child" 2>/dev/null
}

trap _term SIGTERM

log Starting gunicorn in background
gunicorn rtmis.wsgi --max-requests 200 --workers 6 --timeout 300 --bind 0.0.0.0:8000 &

child=$!
wait "$child"
