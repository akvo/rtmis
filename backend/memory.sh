#!/usr/bin/env bash
# shellcheck disable=SC2155

echo "      date     time $(free -h | grep total | sed -E 's/^    (.*)/\1/g')"
while true; do
    echo "$(date '+%Y-%m-%d %H:%M:%S') $(free -h | grep Mem: | sed 's/Mem://g')"
    sleep 1
done
