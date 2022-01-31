#!/usr/bin/env bash

set -eu

echo "Running lint"
flake8

echo "Running tests"
COVERAGE_PROCESS_START=./.coveragerc \
  coverage run --parallel-mode --concurrency=multiprocessing --rcfile=./.coveragerc \
  manage.py test --shuffle --parallel 4

echo "Coverage"
coverage combine --rcfile=./.coveragerc
coverage report -m --rcfile=./.coveragerc

# echo "${SEMAPHORE}"
# echo "${SEMAPHORE_JOB_ID}"
# echo "${SEMAPHORE_WORKFLOW_ID}"
# echo "${SEMAPHORE_GIT_PR_NUMBER}"

if [[ -n "${COVERALLS_REPO_TOKEN}" ]] ; then
  echo "Push coverage to coveralls.io"
  coveralls debug
fi


echo "Done"
