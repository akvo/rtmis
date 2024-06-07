#!/usr/bin/env bash
# shellcheck disable=SC2129
set -eu

dir="./source/forms"

echo "RUNNING THE JOB"
for file in "$dir"/*.prod.json; do
    filename=$(basename "$file")
    form_id="${filename%.prod.json}"
    ./manage.py generate_excel_data "$form_id" --latest=True --use-label=True
    ./manage.py generate_excel_data "$form_id" --use-label=True
    ./manage.py generate_excel_data "$form_id" --submission="verification" --latest=True --use-label=True
    ./manage.py generate_excel_data "$form_id" --submission="verification" --use-label=True
    ./manage.py generate_excel_data "$form_id" --submission="certification" --latest=True --use-label=True
    ./manage.py generate_excel_data "$form_id" --submission="certification" --use-label=True
    sleep 5
done
echo "FINISHED"

# The directory containing the result files
cron_dir="./storage/cronjob_results"
output_html="./storage/cronjob_results/index.html"

# Start the HTML document
echo "<html>" >"$output_html"
echo "<head><title>File List</title>"
# Add Bootstrap CSS
echo "<link rel='stylesheet' href='https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css'>" >>"$output_html"
# Add Custom CSS Max Height List Scroll
echo "</head>" >>"$output_html"
echo "<body>" >>"$output_html"
# Header Padding
echo "<div class='container' style='padding-top: 20px; padding-bottom: 20px;'>" >>"$output_html"
# Center Header
echo "<h3 class='text-center'>File List</h3>" >>"$output_html"
# Last Updated
echo "<p class='text-center'>Last Updated: $(date)</p>" >>"$output_html"
echo "<ul class='list-group' style='padding-bottom: 20px;'>" >>"$output_html"
for file in "$cron_dir"/*.xlsx; do
    filename=$(basename "$file")
    echo "<li class='list-group-item'><a href='$filename'>$filename</a></li>" >>"$output_html"
done
echo "</ul>" >>"$output_html"
echo "</div>" >>"$output_html"
# Footer
echo "</body>" >>"$output_html"
echo "</html>" >>"$output_html"

echo "HTML file created: $output_html"

# Please do not remove the line below.
# This command is necessary for the app to request
# the cloud-proxy-sql to exit for job execution.
# Keep this at the bottom of this file.
curl -X POST localhost:9091/quitquitquit
