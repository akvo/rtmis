#!/usr/bin/env bash
set -exuo pipefail

PODS="frontend backend"

push_image () {
    docker push "eu.gcr.io/akvo-lumen/$1:latest"
    echo "image pushed"
}

for POD in ${PODS}
do
    ci/k8s/wait-for-k8s-deployment-to-be-ready.sh "$POD"
done

