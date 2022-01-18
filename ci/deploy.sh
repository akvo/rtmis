#!/usr/bin/env bash
set -exuo pipefail

push_image () {
    backend_prefix="eu.gcr.io/akvo-lumen/rtmis/backend:latest"
    docker push "${backend_prefix}"
}

{
    frontend_prefix="eu.gcr.io/akvo-lumen/rtmis/frontend:latest"
    docker push "${frontend_prefix}"
}

echo "image pushed"
