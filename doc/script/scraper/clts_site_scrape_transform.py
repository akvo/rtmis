import pandas as pd

data = pd.read_csv("./administration_scraped.csv")
villages = data[data["level"] == "Village"]


def get_name(df, value, name={}, path=[]):
    if value.get("parent"):
        path.append(str(value["parent"]))
        parent = df[df["id"] == value["parent"]].to_dict("records")
        if len(parent):
            name.update({parent[0]["level"]: parent[0]["name"]})
        return get_name(df, parent[0], name, path)
    path.reverse()
    name.update({"path_id": ".".join(path)})
    return name


res = []
for v in villages.to_dict("records"):
    name = get_name(data, v, {v["level"]: v["name"]}, [str(v["id"])])
    res.append(name)

pd.DataFrame(res)[["path_id", "County", "Subcounty", "Ward", "Village"
                   ]].to_csv("./administration_scraped_transformed.csv",
                             index=False)
