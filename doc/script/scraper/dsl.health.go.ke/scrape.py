import pandas as pd
import requests as r
import json


API_URL = "http://dsl.health.go.ke/dsl/api"

administrative = [{"id": "18", "parentid": None, "level": "1", "name": "KENYA"}]

administrative_levels = ["counties", "subcounties", "wards"]

for level in administrative_levels:
    data = r.get(f"{API_URL}/{level}")
    data = json.loads(data.text)
    administrative += data

administrative = pd.DataFrame(administrative)
administrative.to_csv("./administrative.csv", index=False)

facilities = []
facility_levels = r.get(f"{API_URL}/facilitylevel")
facility_levels = json.loads(facility_levels.text)

for level in facility_levels:
    level_id = level["id"]
    facilities_in_level = r.get(f"{API_URL}/facilitylevel/{level_id}")
    facilities_in_level = json.loads(facilities_in_level.text)
    # Fix Strange Level
    for facility in facilities_in_level:
        administration = administrative[
            administrative["id"] == facility["parentid"]
        ].reset_index()["name"][0]
        facility.update(
            {"facility_level": level_id, "administration_name": administration}
        )
        facilities.append(facility)

facilities = pd.DataFrame(facilities)
facilities.to_csv("./facilities.csv", index=False)
