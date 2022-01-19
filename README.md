# RTMIS

[![Build Status](https://akvo.semaphoreci.com/badges/rtmis/branches/main.svg?style=shields)](https://akvo.semaphoreci.com/projects/rtmis) [![Repo Size](https://img.shields.io/github/repo-size/akvo/rtmis)](https://img.shields.io/github/repo-size/akvo/rtmis) [![Languages](https://img.shields.io/github/languages/count/akvo/rtmis)]


Real Time Monitoring Information Systems

## Prerequisite
- Docker > v19
- Docker Compose > v2.1
- Docker Sync 0.7.1

# Development

## Environment Setup

Expected that PORT 5432 and 3000 are not being used by other services.

### Start

For initial run, you need to create a new docker volume.
```
$ docker volume create rtmis-docker-sync
```

```bash
$ ./dc.sh up -d
```

The app should be running at: [localhost:3000](http://localhost:3000). Any endpoints with prefix
- `^/api/*` is redirected to [localhost:8000/api](http://localhost:8000/api)
- `^/static-files/*` is for worker service in [localhost:8000](http://localhost:8000/static-files)

### Stop

```bash
$ ./dc.sh stop
```

### Log
```bash
$ ./dc.sh log --follow <container_name>
```
Available containers:
- backend
- frontend
- mainnetwork
- db
- 

```bash
docker-compose down -d
```

# Production

```
export CI_COMMIT='local'
./ci/build.sh
```

Above command will generate two docker images with prefix `eu.gcr.io/akvo-lumen/rtmis` for backend and frontend
