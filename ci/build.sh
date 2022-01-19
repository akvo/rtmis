#!/usr/bin/env bash
#shellcheck disable=SC2039

docker-compose --version

set -exuo pipefail

[[ -n "${CI_TAG:=}" ]] && { echo "Skip build"; exit 0; }

CI_COMMIT=1
image_prefix="eu.gcr.io/akvo-lumen/rtmis"

dc () {
    docker-compose \
        --ansi never \
        "$@"
}

dci () {
    dc -f docker-compose.ci.yml "$@"
}

frontend_build () {

    echo "PUBLIC_URL=/" > frontend/.env

    dc -f docker-compose.yml run \
       --rm \
       --no-deps \
       frontend \
       sh release.sh

    docker build \
        --tag "${image_prefix}/frontend:latest" \
        --tag "${image_prefix}/frontend:${CI_COMMIT}" frontend
}

backend_build () {

    docker build \
        --tag "${image_prefix}/backend:latest" \
        --tag "${image_prefix}/backend:${CI_COMMIT}" backend
}

echo "Build"

backend_build
frontend_build

test-connection
if ! dci run -T ci ./basic.sh; then
  dci logs
  echo "Build failed when running basic.sh"
  exit 1
fi
