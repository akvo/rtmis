#!/bin/bash
set -euv

#Git Pull
git pull

#Rebuild Documentation
CI_COMMIT=latest docker compose -f docker-compose.documentation-build.yml up --build

#Rebuild Frontend
CI_COMMIT=latest docker compose -f docker-compose.frontend-build.yml up --build


#Rebuild App
CI_COMMIT=latest docker compose -f docker-compose.app.yml build --no-cache

#Restart Service
docker compose -f docker-compose.app.yml exec -u root frontend sh -c 'rm -rf /var/tmp/cache/*'
docker compose -f docker-compose.app.yml stop && docker compose -f docker-compose.app.yml up -d