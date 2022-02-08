#!/usr/bin/env bash
#shellcheck disable=SC2039

set -exuo pipefail

if grep -q .yml .gitignore; then
    echo "ERROR: .gitignore contains other docker-compose file"
    exit 1
fi

BACKEND_CHANGES=0
FRONTEND_CHANGES=0
COMMIT_CONTENT=$(git diff --name-only "${CI_COMMIT_RANGE}")

if grep -q "backend" <<< "${COMMIT_CONTENT}"
then
    BACKEND_CHANGES=1
fi

if grep -q "frontend" <<< "${COMMIT_CONTENT}"
then
    FRONTEND_CHANGES=1
fi

if [[ "${CI_BRANCH}" ==  "main" || "${CI_BRANCH}" ==  "develop" ]];
then
    BACKEND_CHANGES=1
    FRONTEND_CHANGES=1
fi


[[ -n "${CI_TAG:=}" ]] && { echo "Skip build"; exit 0; }

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

    # Code Quality and Build Folder
    sed 's/"warn"/"error"/g' < frontend/.eslintrc.json > frontend/.eslintrc.prod.json

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

    # Code Quality
    dc -f docker-compose.test.yml -p backend-test run \
        --rm \
        backend ./run-qc.sh
}

update_dbdocs() {
    if [[ "${CI_BRANCH}" ==  "main" || "${CI_BRANCH}" ==  "develop" ]]; then
        npm install -g dbdocs
        # dbdocs build doc/dbml/schema.dbml --project rtmis
        dbdocs build backend/db.dbml --project "rtmis-$CI_BRANCH"
    fi
}

if [[ ${BACKEND_CHANGES} == 1 ]];
then
    echo "================== * BACKEND BUILD * =================="
    backend_build
else
    echo "No Changes detected for backend -- SKIP BUILD"
fi

if [[ ${FRONTEND_CHANGES} == 1 ]];
then
    echo "================== * FRONTEND BUILD * =================="
    frontend_build
else
    echo "No Changes detected for frontend -- SKIP BUILD"
fi

if [[ ${FRONTEND_CHANGES} == 1 && ${BACKEND_CHANGES} == 1 ]]; then
    if ! dci run -T ci ./basic.sh; then
      dci logs
      echo "Build failed when running basic.sh"
      exit 1
    fi
fi

update_dbdocs
