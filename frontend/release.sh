#!/bin/sh

#yarn install
#yarn build

#set -euo pipefail

echo PUBLIC_URL="/" > .env
yarn install --no-progress --frozen-lock
yarn eslint src/
yarn prettier --check src/
yarn build
