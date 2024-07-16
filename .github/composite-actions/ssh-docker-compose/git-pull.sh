#!/bin/bash
set -eu

# ${1} for Server IP
# ${2} for Server Port
# ${3} for Server User

server_ip="${1}"
server_port="${2}"
server_user="${3}"


ssh -i priv.key -o BatchMode=yes \
    -p "${server_port}" \
    -o UserKnownHostsFile=/dev/null \
    -o StrictHostKeyChecking=no \
    "${server_user}"@"${server_ip}" "cd src/ && git pull"