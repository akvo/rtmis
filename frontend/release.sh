#!/usr/bin/env bash
#shellcheck disable=SC2039

set -euo pipefail

sed -i 's/"warn"/"error"/g' < .eslintrc.json > .eslintrc.prod.json

yarn install --no-progress --frozen-lock
yarn eslint -c .eslintrc.prod.json src/
yarn prettier --check src/
yarn build
