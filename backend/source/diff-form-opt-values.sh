#!/usr/bin/env bash

dir="./forms"
output_dir="./value_changes"
mkdir -p "${output_dir}"
issue_number="$(git rev-parse --abbrev-ref HEAD | sed 's/[^0-9]*//g')"
for file in "$dir"/*.prod.json; do
    # Diff with current branch
    if [ -z "$(git diff --word-diff develop..HEAD -- "${file}")" ]; then
        continue
    fi
    csv_file="${output_dir}/${issue_number}-$(basename "${file}" .prod.json).csv"
    echo "current, previous" >"${csv_file}"
    git diff --word-diff develop..HEAD -- "${file}" \
			| grep "value" | sed 's/"value"\:\ //g' \
			| sed s/\",/\"/g | sed 's/^ *//g' \
			| sed 's/\[-//g' | sed 's/-\]/,/g' \
			| sed 's/,{+/,/g' | sed 's/+}//g' >> "${csv_file}"
done
