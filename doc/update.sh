#!/usr/bin/env bash

if ! dbdocs -v dbdocs > /dev/null
then
    echo "Please install dbdocs CLI! https://dbdocs.io/docs"
    exit
else
    dbdocs build schema.dbml --project rtmis
fi
