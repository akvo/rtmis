#!/usr/bin/env bash
set -exuo pipefail

#Detect tag for prod/staging deployment
tag_pattern="^[0-9]+\.[0-9]+\.[0-9]+$"
if [[ "${CI_BRANCH}" =~ $tag_pattern && -z "${CI_TAG}" ]]; then
    echo "This commit processed on Release CI. Skip all"
    exit 0
fi

[[ "${CI_BRANCH}" !=  "main" && ! "${CI_TAG:=}" =~ $tag_pattern ]] && { echo "Branch different than main and not a tag. Skip deploy"; exit 0; }
[[ "${CI_PULL_REQUEST}" ==  "true" ]] && { echo "Pull request. Skip deploy"; exit 0; }

auth () {
    gcloud auth activate-service-account --key-file=/home/runner/work/rtmis/credentials/gcp.json
    gcloud config set project akvo-lumen
    gcloud config set container/cluster europe-west1-d
    gcloud config set compute/zone europe-west1-d
    gcloud config set container/use_client_certificate False
    gcloud auth configure-docker "eu.gcr.io"
}

push_image () {
    prefix="eu.gcr.io/akvo-lumen/rtmis"
    docker push "${prefix}/${1}:${CI_COMMIT}"
}

prepare_deployment () {
    cluster="test"

    if [[ "${CI_TAG:=}" =~ $tag_pattern ]]; then
        cluster="production"
    fi

    gcloud container clusters get-credentials "${cluster}"

    sed -e "s/\${CI_COMMIT}/${CI_COMMIT}/g;" \
        ci/k8s/deployment.template.yml > ci/k8s/deployment.yml

    sed -e "s/\${CI_COMMIT}/${CI_COMMIT}/g;" \
        ci/k8s/cronjobs.template.yml > ci/k8s/cronjobs.yml

}

apply_deployment () {
    kubectl apply -f ci/k8s/volume-claim.template.yml
    kubectl apply -f ci/k8s/deployment.yml
    kubectl apply -f ci/k8s/cronjobs.yml
    kubectl apply -f ci/k8s/service.yml
}

auth

if [[ -z "${CI_TAG:=}" ]]; then
    push_image backend
    push_image worker
    push_image frontend
fi

prepare_deployment
apply_deployment

ci/k8s/wait-for-k8s-deployment-to-be-ready.sh
