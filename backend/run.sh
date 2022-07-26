#!/usr/bin/env bash
# shellcheck disable=SC2155

./wait-for-it.sh -h "${DB_HOST}" -p 5432 -- echo "Database is up and running"

rm /var/tmp/cache/*.djcache

set -eu
pip -q install --upgrade pip
pip -q install --cache-dir=.pip -r requirements.txt
pip check

python manage.py migrate
python manage.py generate_config
python manage.py runserver 0.0.0.0:8000
