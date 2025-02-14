# RTMIS

[![Build Status](https://github.com/akvo/rtmis/actions/workflows/main.yml/badge.svg)](https://github.com/akvo/rtmis/actions/workflows/main.yml?query=branch%3Amain) [![Build Status](https://github.com/akvo/rtmis/actions/workflows/apk-release.yml/badge.svg)](https://github.com/akvo/rtmis/actions/workflows/apk-release.yml?query=branch%3Amain) [![Repo Size](https://img.shields.io/github/repo-size/akvo/rtmis)](https://img.shields.io/github/repo-size/akvo/rtmis) [![Languages](https://img.shields.io/github/languages/count/akvo/rtmis)](https://img.shields.io/github/languages/count/akvo/rtmis) [![Issues](https://img.shields.io/github/issues/akvo/rtmis)](https://img.shields.io/github/issues/akvo/rtmis) [![Last Commit](https://img.shields.io/github/last-commit/akvo/rtmis/main)](https://img.shields.io/github/last-commit/akvo/rtmis/main) [![Coverage Status](https://coveralls.io/repos/github/akvo/rtmis/badge.svg)](https://coveralls.io/github/akvo/rtmis) [![Coverage Status](https://img.shields.io/readthedocs/rtmis?label=read%20the%20docs)](https://rtmis.readthedocs.io/en/latest)

Real Time Monitoring Information Systems

## Prerequisite

- Docker > v19
- Docker Compose > v2.1
- Docker Sync 0.7.1

## Development

### Environment Setup

Expected that PORT 5432 and 3000 are not being used by other services.

.env

```bash
DB_HOST=db
DB_PASSWORD=password
DB_SCHEMA=rtmis
DB_USER=akvo
DEBUG="True"
DJANGO_SECRET=local-secret
GOOGLE_APPLICATION_CREDENTIALS
MAILJET_APIKEY
MAILJET_SECRET
WEBDOMAIN
POSTGRES_PASSWORD=password
PGADMIN_DEFAULT_EMAIL=dev@akvo.org
PGADMIN_DEFAULT_PASSWORD=password
PGADMIN_LISTEN_PORT="5050"
IP_ADDRESS="http://<your_ip_address>:3000/api/v1/device"
APK_UPLOAD_SECRET="123456789AU"
STORAGE_PATH="./storage"
SENTRY_DSN="<<your sentry DSN for BACKEND>>"
SENTRY_MOBILE_ENV="<<your sentry env>>"
SENTRY_MOBILE_DSN="<<your_sentry_mobile_DSN>>"
SENTRY_MOBILE_AUTH_TOKEN="<<your_sentry_mobile_auth_token>>"
```


You can generate a Sentry auth token by following [this official Sentry documentation](https://docs.sentry.io/account/auth-tokens/).

#### Start

For initial run, you need to create a new docker volume.

```bash
./dc.sh up -d
```

```bash
docker volume create rtmis-docker-sync
```

Note: On some linux systems, you may need to change the permissions of the directory where the volume is stored.

The development site should be running at: [localhost:3000](http://localhost:3000). Any endpoints with prefix

- `^/api/*` is redirected to [localhost:8000/api](http://localhost:8000/api)
- `^/static-files/*` is for worker service in [localhost:8000](http://localhost:8000/static-files)

Network Config:

- [setupProxy.js](https://github.com/akvo/rtmis/blob/main/frontend/src/setupProxy.js)
- [mainnetwork](https://github.com/akvo/rtmis/blob/docker-compose.override.yml#L4-L8) container setup

Add New User and Seed Master Data:

Once the containers are up and running, you can seed the necessary data by running the following command:

```bash
./dc.sh exec backend ./seeder.sh
```

The script will prompt you for various actions related to data seeding such as:

- seed administrative data
- add a new super admin
- seed fake users
- seed forms
- and seed fake data

Answer each prompt by entering 'y' or 'n' followed by the Enter key.

```bash
./dc.sh exec backend python manage.py generate_views
```

This command will generate materialized view for `DataCategory` model

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

### Troubleshooting

#### APK Build Failed

If the release to Expo fails and shows the following message:

> Found eas-cli in your project dependencies.
> It's recommended to use the "cli.version" field in eas.json to enforce the eas-cli version for your project.
> Learn more: [Expo EAS CLI Documentation](https://github.com/expo/eas-cli#enforcing-eas-cli-version-for-your-project)

This issue is usually caused by an outdated `eas-cli` version. To resolve it, upgrade `eas-cli` in the mobile container by running the following commands:

```sh
./dc-mobile.sh exec mobileapp sh
yarn upgrade eas-cli --ignore-scripts
```

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
