#!/bin/bash
set -eu

# ${1} for Server IP
# ${2} for Server Port
# ${3} for Server User
# ${4} for Dockerfile location

server_ip="${1}"
server_port="${2}"
server_user="${3}"
docker_compose_file="${4}"

ssh -i priv.key -o BatchMode=yes \
    -p "${server_port}" \
    -o UserKnownHostsFile=/dev/null \
    -o StrictHostKeyChecking=no \
    "${server_user}"@"${server_ip}" "cd src/deploy && docker compose -f ${docker_compose_file} stop && docker compose -f ${docker_compose_file} up -d"