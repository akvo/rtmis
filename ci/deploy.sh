#!/usr/bin/env bash
set -exuo pipefail

PODS="frontend backend"

auth () {
    gcloud auth activate-service-account --key-file=/home/semaphore/.secrets/gcp.json
    gcloud config set project akvo-lumen
    gcloud config set container/cluster europe-west1-d
    gcloud config set compute/zone europe-west1-d
    gcloud config set container/use_client_certificate False
    gcloud auth configure-docker "eu.gcr.io"
}

push_image () {
    docker push "eu.gcr.io/akvo-lumen/$1:latest"
    echo "image pushed"
}

auth

for POD in ${PODS}
do
    push_image "$POD"
done

