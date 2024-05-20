#!/bin/bash
# This script is used to generate new version for nmis-mobile

CURRENT_TAG=$(git describe --abbrev=0)
# GET CURRENT VERSION IN /app/package.json
CURRENT_VERSION=$(cat ./app/package.json | grep version | awk -F\" '{print $4}')
CURRENT_BRANCH=$(git branch --show-current)

if [[ "$CURRENT_BRANCH" != "main" ]]; then
    printf "Current Branch: %s\n" "${CURRENT_BRANCH}"
    printf "Please checkout to main branch\n"
    exit 0
else
    git pull
fi

MAJOR=$(echo "${CURRENT_TAG}" | awk -F. '{print $1}')
MINOR=$(echo "${CURRENT_TAG}" | awk -F. '{print $2}')
PATCH=$(echo "${CURRENT_TAG}" | awk -F. '{print $3}')

printf "Current Version: %s\n" "${CURRENT_VERSION}"
printf "Last Release: %s\n" "${CURRENT_TAG}"
read -r -p "Do you want to release new version? [y/N] " response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])+$ ]]; then
    read -r -p "Please select release type [major/minor/patch] " response
    # GENERATE NEW VERSION
    if [[ "$response" == "major" ]]; then
        NEW_VERSION=$(echo "${CURRENT_TAG}" | awk -F. '{$1 = $1 + 1; $2=0; $3=0;} 1' OFS=.)
    elif [[ "$response" == "minor" ]]; then
        NEW_VERSION="${MAJOR}.$((MINOR + 1)).0"
    elif [[ "$response" == "patch" ]]; then
        NEW_VERSION="${MAJOR}.${MINOR}.$((PATCH + 1))"
    else
        printf "Aborted\n"
        exit 0
    fi

    NEW_VERSION_INT=$(echo "$NEW_VERSION" | tr -d '.')

    # UPDATE VERSION IN /app/package.json
    sed -i.bak "s/\"version\": *\"[^\"]*\"/\"version\": \"${NEW_VERSION}\"/" app/package.json
    rm app/package.json.bak

    # UPDATE VERSION IN /app/src/build.json
    sed -i.bak "s/\"appVersion\": *\"[^\"]*\"/\"appVersion\": \"${NEW_VERSION}\"/" app/src/build.json
    rm app/src/build.json.bak

    # UPDATE VERSION IN /app/app.json
    sed -i.bak "s/\"version\": *\"[^\"]*\"/\"version\": \"${NEW_VERSION}\"/" app/app.json
    # UPDATE ANDROID VERSION CODE IN /app/app.json
    sed -i.bak "s/\"versionCode\": *[^\"]*/\"versionCode\": $NEW_VERSION_INT/" app/app.json
    rm app/app.json.bak

    printf "Updated to version: %s\n" "${NEW_VERSION}"
    exit 0
else
    printf "Aborted\n"
    exit 0
fi