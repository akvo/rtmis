#!/usr/bin/env bash
#shellcheck disable=SC2039

set -exuo pipefail

[[ "${CI_BRANCH}" ==  "gh-pages" ]] && { echo "GH Pages update. Skip all"; exit 0; }

#Detect tag for prod/staging deployment
tag_pattern="^[0-9]+\.[0-9]+\.[0-9]+$"
if [[ "${CI_BRANCH}" =~ $tag_pattern && -z "${CI_TAG}" ]]; then
    echo "This commit processed on Release CI. Skip all"
    exit 0
fi


if grep -q .yml .gitignore; then
    echo "ERROR: .gitignore contains other docker-compose file"
    exit 1
fi


BACKEND_CHANGES=0
FRONTEND_CHANGES=0
COMMIT_CONTENT="${ALL_CHANGED_FILES}"

if grep -q "backend" <<< "${COMMIT_CONTENT}"
then
    BACKEND_CHANGES=1
fi

if grep -q "frontend" <<< "${COMMIT_CONTENT}"
then
    FRONTEND_CHANGES=1
fi

if grep -q "docs" <<< "${COMMIT_CONTENT}"
then
    FRONTEND_CHANGES=1
fi

if [[ "${CI_TAG}" =~ $tag_pattern || "${CI_BRANCH}" ==  "main" || "${CI_BRANCH}" ==  "develop" && "${CI_PULL_REQUEST}" !=  "true" ]];
then
    BACKEND_CHANGES=1
    FRONTEND_CHANGES=1
fi

if [ ! -d "${SERVICE_ACCOUNT}" ]
then
    echo "Service account not exists"
    exit 1
fi

image_prefix="eu.gcr.io/akvo-lumen/rtmis"

dc () {
    docker-compose \
        --ansi never \
        "$@"
}

dci () {
    dc -f docker-compose.ci.yml "$@"
}

documentation_build() {
    docker run -i --rm -v "$(pwd)/docs:/docs" \
        akvo/akvo-sphinx:20220525.082728.594558b make html
    cp -r docs/build/html frontend/public/documentation
}

frontend_build () {

    echo "PUBLIC_URL=/" > frontend/.env

    # Code Quality and Build Folder
    sed 's/"warn"/"error"/g' < frontend/.eslintrc.json > frontend/.eslintrc.prod.json
    sed "s/\"##CACHE_VERSION##\"/\"${CI_COMMIT}\"/g" < frontend/public/service-worker.template.js > frontend/public/service-worker.js

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

worker_build() {

    docker build \
        --tag "${image_prefix}/worker:latest" \
        --tag "${image_prefix}/worker:${CI_COMMIT}" backend -f ./backend/Dockerfile.worker

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
    update_dbdocs
else
    echo "No Changes detected for backend -- SKIP BUILD"
fi

if [[ ${FRONTEND_CHANGES} == 1 ]];
then
    echo "================== * FRONTEND BUILD * =================="
    documentation_build
    frontend_build
else
    echo "No Changes detected for frontend -- SKIP BUILD"
fi

if [[ ${FRONTEND_CHANGES} == 1 && ${BACKEND_CHANGES} == 1 ]]; then
    worker_build
    if ! dci run -T ci ./basic.sh; then
      dci logs
      echo "Build failed when running basic.sh"
      exit 1
    fi
fi