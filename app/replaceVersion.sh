#!/bin/bash

# Extract appVersion from build.json
appVersion=$(grep -o '"version": *"[^"]*"' package.json | cut -d'"' -f4)

# Update versionCode in src/build.json
sed -i.bak "s/\"appVersion\": *\"[^\"]*\"/\"appVersion\": \"$appVersion\"/" src/build.json

# Update versionCode in app.json
sed -i.bak "s/\"versionCode\": *\"[^\"]*\"/\"versionCode\": \"$appVersion\"/" app.json

# Remove the backup file created by sed
rm src/build.json.bak
rm app.json.bak
