import requests as r
import json

FLOW_ENDPOINT = "http://localhost:3000/api/form/"
FORM_IDS = ["oqbhqu1erq63wa-jvvt06"]

question_types = {
    "geo": "geo",
    "cascade": "administration",
    "number": "number",
    "free": "text",
    "option": "option",
    "multiple_option": "multiple_option"
}


def tranform_form(flow_form):
    question_groups = []
    for qg in flow_form.get("questionGroup"):
        question_group = {"question_group": qg.get("heading")}
        questions = []
        for q in qg.get("question"):
            options = q.get("options")
            qtype = question_types.get(q.get("type"))
            vrule = q.get("validationRule")
            if vrule:
                if vrule.get("validationType") == "numeric":
                    qtype = question_types.get("number")
            if options:
                if options.get("allowMultiple"):
                    qtype = question_types.get("multiple_option")
                options = [{
                    "name": o.get("text")
                } for o in options.get("option")]
            question = {
                "id": int(q.get("id").replace("Q", "")),
                "meta": q.get("localeNameFlag"),
                "question": q.get("text"),
                "order": q.get("order"),
                "required": q.get("mandatory"),
                "type": qtype,
                "options": options
            }
            dependency = q.get("dependency")
            if dependency:
                dependency = [{
                    "id": d.get("question"),
                    "options": d.get("answerValue")
                } for d in dependency]
                question.update({"dependency": dependency})
            questions.append(question)
        question_group.update({"questions": questions})
        question_groups.append(question_group)
    form_id = flow_form.get("surveyId")
    res = {
        "id": form_id,
        "form": flow_form.get("name"),
        "question_groups": question_groups,
    }
    return res


for FORM_ID in FORM_IDS:
    form = r.get(f"{FLOW_ENDPOINT}{FORM_ID}")
    form = form.json()
    form = tranform_form(form)
    json_object = json.dumps(form, indent=2)
    form_id = form.get("id")
    with open(f"../../backend/source/forms/{form_id}.prod.json",
              "w") as outfile:
        outfile.write(json_object)
