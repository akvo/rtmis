#!/usr/bin/env bash
# shellcheck disable=SC2155

RUN set -e; \
    pip -q install --upgrade pip && \
    pip -q install --no-cache-dir -r requirements.txt && \
    pip check

python manage.py qcluster
