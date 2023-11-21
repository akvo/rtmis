import pandas as pd
import json
import os


matching_files = []
all_files = os.listdir("./")
for filename in all_files:
    if filename.startswith("administrative-lv") and filename.endswith(".json"):
        matching_files.append(filename)


kenya_id = "abcdef90"
all_data = [
    {
        "id": kenya_id,
        "parent": None,
        "name": "Kenya",
    }
]
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
            all_data.append(
                {"id": t.get("id"), "parent": t.get("parent"), "name": t.get("name")}
            )


pd.DataFrame(all_data).to_csv("./administrative.csv", index=False)
