#!/usr/bin/env bash
# shellcheck disable=SC2155

set -eu

python manage.py migrate
python manage.py generate_views
python manage.py generate_sqlite >/dev/null &
python manage.py generate_config >/dev/null &

function log {
    echo "$(date +"%T") - START INFO - $*"
}

_term() {
    echo "Caught SIGTERM signal!"
    kill -TERM "$child" 2>/dev/null
}

trap _term SIGTERM

log Starting gunicorn in background
gunicorn rtmis.wsgi --workers 6 --timeout 300 --bind 0.0.0.0:8000 >>./logs/gunicorn.log 2>&1 &

child=$!
wait "$child"
