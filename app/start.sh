#!/bin/sh

apk update
apk add git
echo "SERVER_URL=${BACKEND_IP_ADDRESS}" >.env
yarn install
yarn start
