#!/usr/bin/env bash
#shellcheck disable=SC2039

set -euo pipefail

RETRIES=10

until psql -h localhost:5432 -U akvo -w password -d rtmis -c "select 1" &>/dev/null 2>&1 || [ $RETRIES -eq 0 ];
do
  echo "Waiting for postgres server, $((RETRIES--)) remaining attempts..."
  sleep 1
done

wait4ports -q -s 1 -t 60 tcp://localhost:80 tcp://localhost:8000

http_get() {
    url="${1}"
    shift
    code="${1}"
    shift
    curl --verbose --url "${url}" "$@" 2>&1 | grep "< HTTP.*${code}"
}

http_get "http://localhost" 200
http_get "http://localhost/api/test?format=json" 301
