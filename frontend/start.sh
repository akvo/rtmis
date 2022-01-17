#!/bin/sh

echo PUBLIC_URL="/" > .env
yarn install
yarn start
