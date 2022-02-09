#!/usr/bin/env bash
# shellcheck disable=SC2155

./wait-for-it.sh \
--service db:5432 \
-- echo "Database is up and running"

RUN set -e; \
    pip -q install --upgrade pip && \
    pip -q install --no-cache-dir -r requirements.txt && \
    pip check

python manage.py migrate
python manage.py administration_seeder
python manage.py runserver 0.0.0.0:8000
