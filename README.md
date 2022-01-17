# RTMIS

Real Time Monitoring Information Systems

# Development

## Environment Setup

## Start

```bash
docker-compose up -d
```

## Stop

```bash
docker-compose stop
```

```bash
docker-compose down -d
```

# Production

```
export CI_COMMIT='local'
./ci/build.sh
```
