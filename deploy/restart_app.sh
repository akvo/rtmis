#!/bin/bash
set -euv

#Restart App
docker compose -f docker-compose.app.yml exec -u root frontend sh -c 'rm -rf /var/tmp/cache/*'
docker compose -f docker-compose.app.yml restart