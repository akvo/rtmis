#!/bin/sh

#yarn install
#yarn build

#set -euo pipefail

yarn install --no-progress --frozen-lock
yarn eslint src/
yarn prettier --check src/
yarn build
