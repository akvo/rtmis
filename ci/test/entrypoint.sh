#!/bin/sh

set -ex

apk --update add \
    --no-cache \
    --no-progress \
    bash~=5.1 \
    curl~=8.0.1-r0 \
    jq~=1.6 \
    wait4ports~=0.3.3-r0 \
    postgresql-client~=13.12

exec "$@"
