#!/usr/bin/env bash

set -eu

./wait-for-it.sh -h "${DB_HOST}" -p 5432 -- echo "Database is up and running"

echo "Running lint"
flake8

echo "Running tests"
COVERAGE_PROCESS_START=./.coveragerc \
  coverage run --parallel-mode --concurrency=multiprocessing --rcfile=./.coveragerc \
  manage.py test --shuffle --parallel 4

echo "Coverage"
coverage combine --rcfile=./.coveragerc
coverage report -m --rcfile=./.coveragerc

# REMEMBER TO TURN BACK ON
# if [[ -n "${COVERALLS_REPO_TOKEN:-}" ]] ; then
#   coveralls
# fi

echo "Generate Django DBML"
python manage.py dbml > db.dbml

echo "Done"
