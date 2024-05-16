#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <auth_code> <number_of_submissions>"
    exit 1
fi

get_auth_token() {
    code=$1
    curl -s -X 'POST' \
        'https://rtmis.akvotest.org/api/v1/device/auth' \
        -H 'accept: application/json' \
        -H 'Content-Type: application/json' \
        -d '{"code": "'$code'"}' | jq -r '.syncToken'
}

URL="https://rtmis.akvotest.org/api/v1/device/sync"
MOBILE_AUTH_TOKEN=$(get_auth_token "$1")
# exit if equal to null
if [ "$MOBILE_AUTH_TOKEN" == "null" ]; then
    echo "Invalid auth code"
    exit 1
fi
SCHEDULE_TIME="now + 1 minute"
LOG_FILE="./sync.log"
touch $LOG_FILE

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
    # the submission payload
    DATA=$(jq . "./tmp/$1.json")

    # Create the curl command to get only the status code
    echo "curl -s -o /dev/null -w \"File:$1.json | Status Code:%{http_code} | Time Total: %{time_total}\n\" -X 'POST' \
    '$URL' \
    -H 'accept: application/json' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer $MOBILE_AUTH_TOKEN' \
    -d '$DATA' >> $LOG_FILE 2>&1" | at "$SCHEDULE_TIME" >/dev/null 2>&1
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
for i in $(seq 1 "$2"); do
    push_data "$input_file" "$i"
done
