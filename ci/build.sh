#!/usr/bin/env bash
#shellcheck disable=SC2039

set -exuo pipefail

[[ -n "${CI_TAG:=}" ]] && { echo "Skip build"; exit 0; }

image_prefix="eu.gcr.io/akvo-lumen/rtmis"

echo "Build"

frontend_build () {

    echo "PUBLIC_URL=/" > ../frontend/.env

    docker build \
        --tag "${image_prefix}/frontend:latest" ../frontend
#        --tag "${image_prefix}/frontend:${CI_COMMIT}" frontend
}

backend_build () {

    docker build \
        --tag "${image_prefix}/backend:latest" ../backend
#        --tag "${image_prefix}/backend:${CI_COMMIT}" backend
}

backend_build
frontend_build
