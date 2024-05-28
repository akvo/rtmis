Overview
--------

This scripts is designed to automate the submission of data to a specified URL endpoint, leveraging JMeter for stress testing. The script modifies a JSON template, generates multiple submissions, and runs a JMeter test to simulate these submissions.

Usage
-----

    ./jmeter_stress_test.sh <auth_code> <number_of_submissions> <ramp_up_period> [unique_name]

*   `<auth_code>`: Authorization code for the API.
*   `<number_of_submissions>`: Number of submissions to be generated.
*   `<ramp_up_period>`: Time (in seconds) to ramp up the test.
*   `[unique_name]` (optional): A unique name for this test run. If not provided, a random name will be generated.

Prerequisites
-------------

*   `jq` installed for JSON processing.
*   Docker installed and running.
*   A JSON template file named `household_submission.json` in the script's directory.
*   JMeter test plan file named `rtmis_stress_test.jmx` in the script's directory.

Example Command
---------------

    ./jmeter_stress_test.sh my_auth_code 100 60 my_unique_test

This command will:

*   Use `my_auth_code` as the authorization code.
*   Generate 100 submissions.
*   Ramp up the test over 60 seconds.
*   Use `my_unique_test` as the unique name for the test run.

If you omit the unique name:

    ./jmeter_stress_test.sh my_auth_code 100 60

A random unique name will be generated automatically.

Output
------

*   Modified JSON files stored in `./tmp/<current_date>/`.
*   CSV metadata: `jmeter_data.csv`
*   JMeter results:
    *   JMeter log: `logs`
    *   JMeter report: `report.jtl`
    *   HTML report: `html-report`