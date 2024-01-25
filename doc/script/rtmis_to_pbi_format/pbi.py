from datetime import datetime
import pandas as pd

downloaded_data = "./download-rtmis_household_monitoring_form-240123-d7fc6544-805d-4ea3-a4aa-414802f1378c.xlsx"  # noqa

prev = pd.read_csv("./previous/1699353915355-Households.csv", sep=";")
curr = pd.read_excel(downloaded_data, sheet_name="data")
adm = pd.read_csv("./administration.csv")


def compare(obj, obj2):
    for id in list(obj2):
        diff = obj.get(id)
        if diff:
            if obj2[id] != diff:
                print(f"CHANGED: {id}|{obj2[id]} -> {diff}")
        else:
            print(f"NOT FOUND: {id}|{obj2[id]}")


def get_adm_full_name(init, path):
    name = []
    if path == path:
        path_ids = [int(a) for a in list(filter(lambda x: x, path.split(".")))]
        for p in path_ids:
            parent = list(adm[adm["id"] == p]["name"])[0]
            name.append(parent)
    name.append(init)
    return "|".join(name)


adm["full_name"] = adm.apply(lambda x: get_adm_full_name(x["name"], x["path"]),
                             axis=1)
adm["path"] = adm.apply(lambda x: x["path"] + str(x["id"])
                        if x["path"] == x["path"] else x["id"],
                        axis=1)
prev_questions = list(filter(lambda x: "|" in x, list(prev)))
curr_questions = list(filter(lambda x: "|" in x, list(curr)))
cq_object = {}
pq_object = {}
for cq in curr_questions:
    [cq_id, cq_name] = cq.split("|")
    cq_object[cq_id] = cq_name
for pq in prev_questions:
    [pq_id, pq_name] = pq.split("|")
    pq_object[pq_id] = pq_name
print("PBI DATASET VS RTMIS DATASET\n")
compare(cq_object, pq_object)
print("\n\nPBI DATASET VS RTMIS DATASET\n")
compare(pq_object, cq_object)
curr["rand_point_id"] = curr["id"]
curr["Path"] = curr["administration"].apply(
    lambda x: list(adm[adm["full_name"] == x]["path"])[0])
curr[["Latitude", "Longitude"]] = curr["geolocation"].str.split(",",
                                                                expand=True)
curr[["National", "County", "Sub-County", "Ward",
      "Village"]] = curr["administration"].str.split("|", expand=True)
curr[[
    "National code", "County code", "Sub-County code", "Ward code",
    "Village code"
]] = curr["Path"].str.split(".", expand=True)
curr = curr.rename(columns={
    "administration": "Address",
    "datapoint_name": "Datapoint"
})

columns_to_drop = [
    'created_at', 'created_by', 'updated_at', 'updated_by', 'geolocation'
]
curr = curr.drop(columns=columns_to_drop)

print("\n\nCHECK MISSING POWER BI META\n")
for pr in list(prev):
    if pr not in list(curr) and "|" not in pr:
        print(f"NOT FOUND: {pr}")

column_order = [
    "id", "Longitude", "Latitude", "rand_point_id", "County", "County code",
    "Sub-County", "Sub-County code", "Ward", "Ward code", "Village",
    "Village code", "Path"
] + list(filter(lambda x: "|" in x, list(curr)))

curr = curr[column_order]

date_now = datetime.now().strftime("%m-%d-%y")
curr.to_csv(f"./results/HH-result-dataset-{date_now}.csv", index=False)
print("\n\nSUCCESSFULLY TRANSFORMED!\n")
