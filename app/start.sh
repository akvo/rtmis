#!/bin/sh

apk update
apk add git
echo "SERVER_URL=${BACKEND_IP_ADDRESS}" >.env
echo "APK_URL=${WEBDOMAIN}/app" >>.env
echo "SENTRY_ENV=${SENTRY_ENV}" >>.env
echo "SENTRY_DSN=${SENTRY_DSN}" >>.env
echo "SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}" >>.env
yarn install
yarn start
