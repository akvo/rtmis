# RTMIS

[![Build Status](https://akvo.semaphoreci.com/badges/rtmis/branches/main.svg?style=shields)](https://akvo.semaphoreci.com/projects/rtmis) [![Repo Size](https://img.shields.io/github/repo-size/akvo/rtmis)](https://img.shields.io/github/repo-size/akvo/rtmis) [![Languages](https://img.shields.io/github/languages/count/akvo/rtmis)](https://img.shields.io/github/languages/count/akvo/rtmis) [![Issues](https://img.shields.io/github/issues/akvo/rtmis)](https://img.shields.io/github/issues/akvo/rtmis) [![Last Commit](https://img.shields.io/github/last-commit/akvo/rtmis/main)](https://img.shields.io/github/last-commit/akvo/rtmis/main) [![Coverage Status](https://coveralls.io/repos/github/akvo/rtmis/badge.svg)](https://coveralls.io/github/akvo/rtmis) [![Coverage Status](https://img.shields.io/readthedocs/rtmis?label=read%20the%20docs)](https://rtmis.readthedocs.io/en/latest)

Real Time Monitoring Information Systems

## Prerequisite

- Docker > v19
- Docker Compose > v2.1
- Docker Sync 0.7.1

## Development

### Environment Setup

Expected that PORT 5432 and 3000 are not being used by other services.

#### Start

For initial run, you need to create a new docker volume.

```bash
./dc.sh up -d
```

```bash
docker volume create rtmis-docker-sync
```

The development site should be running at: [localhost:3000](http://localhost:3000). Any endpoints with prefix

- `^/api/*` is redirected to [localhost:8000/api](http://localhost:8000/api)
- `^/static-files/*` is for worker service in [localhost:8000](http://localhost:8000/static-files)

Network Config:

- [setupProxy.js](https://github.com/akvo/rtmis/blob/main/frontend/src/setupProxy.js)
- [mainnetwork](https://github.com/akvo/rtmis/blob/docker-compose.override.yml#L4-L8) container setup

#### Log

```bash
./dc.sh log --follow <container_name>
```

Available containers:

- backend
- frontend
- mainnetwork
- db
- pgadmin

#### Stop

```bash
./dc.sh stop
```

#### Teardown

```bash
./dc.sh down -t1
docker volume rm rtmis-docker-sync
```

## Mobile App Development

For initial run, you need to create a separate docker volume.

```bash
docker volume create rtmis-mobile-docker-sync
```

```bash
./dc-mobile.sh up -d
```

1. Install the [**Expo Go**](https://play.google.com/store/apps/details?id=host.exp.exponent&hl=en&gl=US&pli=1) app from Playstore
2. Connect your android to the same wireless network as your machine.
3. Open The Expo Go
4. Enter URL Manually: `Your_IP_Address:19000`

#### Teardown Mobile App

```bash
./dc-mobile.sh down -t1
```

## Production

```bash
export CI_COMMIT='local'
./ci/build.sh
```

Above command will generate two docker images with prefix `eu.gcr.io/akvo-lumen/rtmis` for backend and frontend

```bash
docker-compose -f docker-compose.yml -f docker-compose.ci.yml up -d
```

Network config: [nginx](https://github.com/akvo/rtmis/blob/main/frontend/nginx/conf.d/default.conf)
