import requests as r
import pandas as pd
import json

HEADERS = {
    "Accept": "application/json, */*",
    "Authorization": "Bearer TMDwn95aV5UuNcBdKPXes0JXRD53xz",
}


def getit(url, fields, filename="facilities"):
    results = []

    api_url = f"{url}?{fields}"
    while True:
        print("[GET]", api_url)
        data = r.get(api_url, headers=HEADERS)
        data = data.json()
        results += data["results"]
        if data.get("next"):
            api_url = data["next"]
        else:
            break

    pd.DataFrame(results).to_csv(f"./{filename}.csv", index=False)
    json_data = json.dumps(results, indent=4)

    with open(f"{filename}-all.json", "w") as f:
        f.write(json_data)


# Health Facilities
URL = "https://api.kmhfl.health.go.ke/api/facilities/material/?fields="
FIELDS = "id,code,name,regulatory_status_name,facility_type_name,owner_name,county,constituency,ward_name,keph_level,operation_status_name"
print("[COLLECTING] HEALTH FACILITIES")
getit(URL, FIELDS)

# Community Units
URL = "https://api.kmhfl.health.go.ke/api/chul/units/?fields="
FIELDS = "id,code,name,status_name,date_established,facility,facility_name,facility_county,facility_subcounty,facility_ward,facility_constituency"
print("[COLLECTING] COMMUNITY UNITS")
getit(URL, FIELDS, filename="community_units")
