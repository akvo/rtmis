import pandas as pd
import json
import os

matching_files = []
all_files = os.listdir("./")
for filename in all_files:
    if filename.startswith("administrative-lv") and filename.endswith(".json"):
        matching_files.append(filename)

kenya_id = "abcdef90"
all_data = [{
    "id": kenya_id,
    "parent": None,
    "name": "Kenya",
}]
normal_data = []
for filename in sorted(matching_files):
    with open(f"./{filename}", "r") as f:
        temp_data = json.loads(f.read())
        for t in temp_data:
            if "lv-2" in filename:
                t.update({"parent": kenya_id})
            elif "lv-3" in filename or "lv-4" in filename:
                t.update({"parent": t.get("county")})
            if "lv-5" in filename:
                t.update({"parent": t.get("constituency")})
            all_data.append({
                "id": t.get("id"),
                "parent": t.get("parent"),
                "name": t.get("name")
            })
with open("./administrative-lv-5-wards.json", "r") as f:
    temp_data = json.loads(f.read())
    for t in temp_data:
        ndata = {"wards_id": t["id"], "wards": t["name"]}
        for li in list(t):
            find_id = list(filter(lambda x: x["id"] == t[li], all_data))
            if find_id and li != "id":
                ndata.update({f"{li}_id": t[li]})
                ndata.update({li: find_id[0]["name"]})
                if li == "sub_county":
                    find_county = list(
                        filter(lambda x: x["id"] == find_id[0]["parent"],
                               all_data))[0]
                    ndata.update({
                        "county_id": find_id[0]["parent"],
                        "county": find_county["name"]
                    })
        normal_data.append(ndata)

pd.DataFrame(normal_data)[[
    "county_id", "county", "sub_county_id", "sub_county", "constituency_id",
    "constituency", "wards_id", "wards"
]].to_csv("./administrative-normal-format.csv", index=False)

# In[ ]:
