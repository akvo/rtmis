#!/usr/bin/env bash
# shellcheck disable=SC2129
set -eu

dir="./source/forms"

echo "RUNNING THE JOB"
for file in "$dir"/*.prod.json; do
    filename=$(basename "$file")
    form_id="${filename%.prod.json}"
    ./manage.py generate_excel_data "$form_id" --latest=True
    ./manage.py generate_excel_data "$form_id"
    ./manage.py generate_excel_data "$form_id" --submission="verification"
    ./manage.py generate_excel_data "$form_id" --submission="certification"
    sleep 5
done
echo "FINISHED"

# The directory containing the result files
cron_dir="./storage/cronjob_results"
output_html="./storage/cronjob_results/index.html"

# Start the HTML document
echo "<html>" >"$output_html"
echo "<head><title>File List</title></head>" >>"$output_html"
echo "<body>" >>"$output_html"
echo "<h1>List of Files</h1>" >>"$output_html"
echo "<h2>Last updated: $(date)</h2>" >>"$output_html"
echo "<ul>" >>"$output_html"
for file in "$cron_dir"/*.xlsx; do
    filename=$(basename "$file")
    echo "<li><a href='/cronjob_results/$filename'>$filename</a></li>" >>"$output_html"
done
echo "</ul>" >>"$output_html"
echo "</body>" >>"$output_html"
echo "</html>" >>"$output_html"

echo "HTML file created: $output_html"

# Please do not remove the line below.
# This command is necessary for the app to request
# the cloud-proxy-sql to exit for job execution.
# Keep this at the bottom of this file.
curl -X POST localhost:9091/quitquitquit
