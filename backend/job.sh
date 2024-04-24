#!/usr/bin/env bash
set -eu


date
sleep 10


# Please do not remove the line below. This command is necessary for the app to request the cloud-proxy-sql to exit for job execution. Keep this at the bottom of this file.
curl -X POST localhost:9091/quitquitquit