#!/usr/bin/env bash

docker-compose exec backend python manage.py generate_config
