#!/bin/bash

# Extract appVersion from build.json
appVersion=$(grep -o '"appVersion": *"[^"]*"' src/build.json | cut -d'"' -f4)

# Update versionCode in app.json
sed -i.bak "s/\"versionCode\": *\"[^\"]*\"/\"versionCode\": \"$appVersion\"/" app.json

# Remove the backup file created by sed
rm app.json.bak
