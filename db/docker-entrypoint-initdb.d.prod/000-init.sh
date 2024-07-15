#!/bin/bash
set -e


psql -v ON_ERROR_STOP=1 --username "postgres" <<-EOSQL

CREATE USER "${DB_USER}" WITH CREATEDB PASSWORD '${DB_PASSWORD}';

CREATE DATABASE "${DB_SCHEMA}"
WITH OWNER = "${DB_USER}"
     TEMPLATE = template0
     ENCODING = 'UTF8'
     LC_COLLATE = 'en_US.UTF-8'
     LC_CTYPE = 'en_US.UTF-8';

\c "${DB_SCHEMA}"

CREATE EXTENSION IF NOT EXISTS ltree WITH SCHEMA public;

EOSQL
