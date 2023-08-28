import requests as r
import pandas as pd
import json

URL = "https://api.kmhfl.health.go.ke/api/facilities/material/?fields="
FIELDS = "id,code,name,regulatory_status_name,facility_type_name,owner_name,county,constituency,ward_name,keph_level,operation_status_name"

HEADERS = {
    "Accept": "application/json, */*",
    "Authorization": "Bearer TMDwn95aV5UuNcBdKPXes0JXRD53xz",
}

results = []

api_url = f"{URL}?{FIELDS}"
while True:
    print("[GET]", api_url)
    data = r.get(api_url, headers=HEADERS)
    data = data.json()
    results += data["results"]
    if data.get("next"):
        api_url = data["next"]
    else:
        break

pd.DataFrame(results).to_csv("./facilities.csv", index=False)
json_data = json.dumps(results, indent=4)

with open("facilities-all.json", "w") as f:
    f.write(json_data)
