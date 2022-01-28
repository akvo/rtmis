#!/usr/bin/env bash

ROOT_DIR=$(git rev-parse --show-toplevel)

if ! dbdocs -v dbdocs > /dev/null
then
    echo "Please install dbdocs CLI! https://dbdocs.io/docs"
    exit
fi

docker-compose exec backend python manage.py dbml > "$ROOT_DIR"/doc/dbml/current.dbml
dbdocs build "$ROOT_DIR"/doc/dbml/schema.dbml --project rtmis
dbdocs build "$ROOT_DIR"/doc/dbml/current.dbml --project rtmis-django
