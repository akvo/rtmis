#!/usr/bin/env bash
#shellcheck disable=SC2039

set -euo pipefail

yarn install --no-progress --frozen-lock
yarn eslint --config .eslintrc.prod.json src --ext .js,.jsx
yarn prettier --check src/
yarn test:ci
yarn build
