#!/bin/bash

if [ "$#" -lt 3 ]; then
    echo "Usage: $0 <auth_code> <number_of_submissions> <ramp_up_period> <optional:unique_name>"
    exit 1
fi
# pick random unique name if not provided
if [ -z "$4" ]; then
    unique_name=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
else
    unique_name=$4
fi

AUTH_CODE=$1
URL="https://rtmis.akvotest.org/api/v1/device/sync"

# jq function to generate a random UUID
generate_uuid() {
    cat /proc/sys/kernel/random/uuid
}

# Create ./tmp folder if it doesn't exist
current_date=$(date +"%Y-%m-%d_%H-%M-%S")
mkdir -p ./tmp/$current_date

# Function to modify the JSON file
#!/usr/bin/env bash

push_data() {
    local infile=$1
    uuid=$(generate_uuid)
    # add leading zero to the index
    index=$(printf "%04d" "$2")
    unique_name=$3
    local outfile="./tmp/$current_date/$index.json"

    # Modify the JSON object and remove id field
    jq --arg new_uuid "${uuid}" --arg index "${index}" --arg unique_name "${unique_name}" '
        del(.id) |
        del(.datapoint_name) |
        del(.uuid) |
        del(.administration) |
        .submittedAt = "2024-05-16T04:42:54.074Z" |
        .submitter = "Gaturi Gakui Enumerator" |
        .geo = .geolocation |
        .duration = 10 |
        .formId = "1699353915355" |
        .name = "Gaturi - " + $unique_name + " - " + $index |
        .answers["1702914803732"] = $new_uuid |
        .answers["1703073469466"] = $index |
        .answers["1699419165632"] = $unique_name |
        del(.geolocation)
    ' "$infile" >"$outfile"

    echo "$unique_name,$index,$(pwd)/tmp/$current_date/$index.json" >> ./tmp/$current_date/jmeter_data.csv
    echo "Modified JSON objects are stored in $outfile"
}

# Input JSON file
input_file="./household_submission.json"

echo "Submitting ${unique_name} with ${2} submissions"

# Insert CSV Header
echo "unique_name,index,file_path" >> ./tmp/$current_date/jmeter_data.csv

# Repeat x times
for i in $(seq 1 "$2"); do
    push_data "$input_file" "$i" "$unique_name"
done

# Run JMeter on Docker
docker run -i \
    -v ${PWD}:${PWD} \
    -w ${PWD} \
    alpine/jmeter \
    -n \
    -t rtmis_stress_test.jmx \
    -Jdatafile=./tmp/$current_date/jmeter_data.csv \
    -Jauthcode=$AUTH_CODE \
    -Jrampup=$3 \
    -Jthreads=$2 \
    -l ./tmp/$current_date/report.jtl \
    -j ./tmp/$current_date/logs \
    -e \
    -o ./tmp/$current_date/html-report
