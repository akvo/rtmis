#!/usr/bin/python

import json

form_path = "./../../backend/source/forms/"

forms = [{
    "file": "1699353915355.prod.json",
    "qid": 1699354220734
}, {
    "file": "1699354006503.prod.json",
    "qid": 1699354006535
}, {
    "file": "1701172125596.prod.json",
    "qid": 1701172125598
}, {
    "file": "1701757876668.prod.json",
    "qid": 1701757914033
}]


def autofill(form):
    with open(form_path + form["file"], "r") as file:
        data = json.load(file)
    options = []
    for qg in data["question_groups"]:
        for q in qg["questions"]:
            if q.get('options'):
                options.append({
                    "id": q["id"],
                    "answer": [q['options'][0]["name"]]
                })
            if q.get("displayOnly") and q.get("required"):
                q.update({"required": False})
    for qg in data["question_groups"]:
        for q in qg["questions"]:
            if q["id"] == form["qid"]:
                q.update({"pre": {"answer": ["New"], "fill": options}})
    with open(form_path + form["file"], "w") as file:
        json.dump(data, file, indent=2)
    print("UPDATE", form["file"])


for f in forms:
    autofill(f)
