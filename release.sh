#!/bin/bash
# This script is used to generate new version for rtmis
set -euv

CURRENT_TAG=$(git describe --tags --abbrev=0)
CURRENT_BRANCH=$(git branch --show-current)

if [[ "${CURRENT_BRANCH}" != "main" ]]; then
    printf "Current Branch: %s\n" "${CURRENT_BRANCH}"
    printf "Please checkout to main branch\n"
    exit 0
else
    git pull
fi

MAJOR=$(echo "${CURRENT_TAG}" | awk -F. '{print $1}')
MINOR=$(echo "${CURRENT_TAG}" | awk -F. '{print $2}')
PATCH=$(echo "${CURRENT_TAG}" | awk -F. '{print $3}')

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
    git tag -a "${NEW_VERSION}" -m "Release ${NEW_VERSION}"
    git push --tags
    gh release create "${NEW_VERSION}" -t "${NEW_VERSION}"
else
    printf "Aborted\n"
    exit 0
fi