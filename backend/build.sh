#!/usr/bin/env bash

set -eu

echo "Running lint"
flake8

echo "Running tests"
./manage.py test --shuffle --parallel 4

echo "Done"
