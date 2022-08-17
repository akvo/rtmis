import pandas as pd

data = pd.read_csv("./administration_scraped.csv")
villages = data[data["level"] == "Village"]


def get_name(df, value, name={}, path=[]):
    if value.get("parent"):
        parent_name = df[df["id"] == value["parent"]].to_dict("records")
        if len(parent_name):
            path.append(str(parent_name[0]["parent"]))
            name.update({parent_name[0]["level"]: parent_name[0]["name"]})
        return get_name(df, parent_name[0], name, path)
    path.reverse()
    name.update({"path_id": ".".join(path)})
    return name


res = []
for v in villages.to_dict("records"):
    name = get_name(data, v, {v["level"]: v["name"]}, [str(v["id"])])
    res.append(name)

pd.DataFrame(res)[["path_id", "County", "Subcounty", "Ward", "Village"
                   ]].to_csv("./administration_scraped_transformed.csv")
