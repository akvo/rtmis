#!/bin/sh

set -ex

apk --update add \
    --no-cache \
    --no-progress \
    bash~=5 \
    curl~=7 \
    jq~=1.6 \
    wait4ports=~0.3 \
    postgresql-client

exec "$@"
