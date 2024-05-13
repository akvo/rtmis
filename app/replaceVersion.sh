#!/bin/bash

# Extract appVersion from build.json
appVersion=$(grep -o '"version": *"[^"]*"' package.json | cut -d'"' -f4)
versionInteger=$(echo "$appVersion" | tr -d '.')

# Update versionCode in src/build.json
sed -i.bak "s/\"appVersion\": *\"[^\"]*\"/\"appVersion\": \"$appVersion\"/" src/build.json
rm src/build.json.bak

# Update version and versionCode in app.json
sed -i.bak "s/\"version\": *\"[^\"]*\"/\"version\": \"$appVersion\"/" app.json
rm app.json.bak
sed -i.bak "s/\"versionCode\": *\"[^\"]*\"/\"versionCode\": $versionInteger/" app.json
rm app.json.bak

echo "Updated to version:" $appVersion
