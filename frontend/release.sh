#!/usr/bin/env bash
#shellcheck disable=SC2039

set -euo pipefail

yarn install --no-progress --frozen-lock
yarn eslint -c .eslintrc.prod.json src/
yarn prettier --check src/
yarn build
