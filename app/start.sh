#!/bin/sh

apk update
apk add git
echo "SERVER_URL=${BACKEND_IP_ADDRESS}" >.env
echo "APK_URL=${WEBDOMAIN}/app" >.env
yarn install
yarn start
