#!/usr/bin/env bash

docker-compose exec backend \
    python -m debugpy --listen 0.0.0.0:8888 \
    manage.py runserver localhost:2000
