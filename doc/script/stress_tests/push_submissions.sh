#!/bin/bash

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <auth_code>"
    exit 1
fi

get_auth_token() {
    curl -s -X 'POST' \
        'https://rtmis.akvotest.org/api/v1/device/auth' \
        -H 'accept: application/json' \
        -H 'Content-Type: application/json' \
        -H 'X-CSRFTOKEN: 8inxCl7WRqWt2enWNQaxpym2N7hN9StDGiccC6YofLz9AC6ORiraiHyuLYYCieTP' \
        -d '{"code": "$1"}' | jq -r '.syncToken'
}

URL="https://rtmis.akvotest.org/api/v1/device/sync"
MOBILE_AUTH_TOKEN=$(get_auth_token $1)
SCHEDULE_TIME="now + 1 minute"
touch sync.log
LOG_FILE="./sync.log"

# jq function to generate a random UUID
generate_uuid() {
    cat /proc/sys/kernel/random/uuid
}

# Create ./tmp folder if it doesn't exist
mkdir -p ./tmp

# Function to modify the JSON file
#!/usr/bin/env bash

# The sync endpoint
push_schedule() {
    # the payload
    DATA=$(jq . "./tmp/$1.json")
    echo "curl -s -X 'POST' \
    '$URL' \
    -H 'accept: application/json' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer $MOBILE_AUTH_TOKEN' \
    -d '$DATA' >> $LOG_FILE 2>&1; echo -e '\n'" | at "$SCHEDULE_TIME"
}

push_data() {
    local infile=$1
    uuid=$(generate_uuid)
    # add leading zero to the index
    index=$(printf "%04d" "$2")
    local outfile="./tmp/$index.json"

    # Modify the JSON object and remove id field
    jq --arg new_uuid "${uuid}" --arg index "$index" '
        del(.id) |
        del(.datapoint_name) |
        del(.uuid) |
        del(.administration) |
        .submittedAt = "2024-05-16T04:42:54.074Z" |
        .submitter = "Gaturi Gakui Enumerator" |
        .geo = .geolocation |
        .duration = 10 |
        .formId = "1699353915355" |
        .name = "Gaturi - Father - " + $index |
        .answers["1702914803732"] = $new_uuid |
        .answers["1703073469466"] = $index |
        del(.geolocation)
    ' "$infile" >>"$outfile"
    echo "Modified JSON objects are stored in $outfile"
    push_schedule "$index"
}

# Input JSON file
input_file="./household_submission.json"

# Repeat 10 times
for i in $(seq 2 10); do
    push_data "$input_file" "$i"
done
