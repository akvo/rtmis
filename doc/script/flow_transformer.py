import requests as r
import json
from pathlib import Path

FLOW_ENDPOINT = "http://webform.akvo.org/api/form/"
FORMS = [{
    "url": "oqbhqu1erq63wa-jvvt06",
    "type": "county"
}, {
    "url": "yoa-ophtjoe2332mrrri4",
    "type": "county"
}, {
    "url": "qn71nxt6vn8jhrrjssrr8",
    "type": "county"
}]

form_types = {"county": 1, "national": 2}

question_types = {
    "geo": "geo",
    "cascade": "administration",
    "number": "number",
    "free": "text",
    "option": "option",
    "multiple_option": "multiple_option"
}


def tranform_form(flow_form, existing_questions):
    question_groups = []
    for qg in flow_form.get("questionGroup"):
        question_group = {"question_group": qg.get("heading")}
        questions = []
        for q in qg.get("question"):
            options = q.get("options")
            qtype = question_types.get(q.get("type"))
            vrule = q.get("validationRule")
            extra = {}
            if vrule:
                if vrule.get("validationType") == "numeric":
                    qtype = question_types.get("number")
            if options:
                if options.get("allowMultiple"):
                    qtype = question_types.get("multiple_option")
                if options.get("allowOther"):
                    extra.update({'allowOther': options.get("allowOther")})
                options = [{
                    "name": o.get("text")
                } for o in options.get("option")]
            qid = int(q.get("id").replace("Q", ""))
            existing = list(
                filter(lambda x: x['id'] == qid, existing_questions))
            attributes = []
            name = None
            if existing:
                name = existing[0].get("name")
                attributes = existing[0].get("attributes") or []
            question = {
                "id": qid,
                "meta": q.get("localeNameFlag"),
                "question": q.get("text"),
                "name": name,
                "order": q.get("order"),
                "required": q.get("mandatory"),
                "type": qtype,
                "attributes": attributes,
                "options": options
            }
            if extra:
                question.update({'extra': extra})
            dependency = q.get("dependency")
            if dependency:
                dependency = [{
                    "id": int(d.get("question").replace("Q", "")),
                    "options": d.get("answerValue")
                } for d in dependency]
                question.update({"dependency": dependency})
            if qtype:
                questions.append(question)
        question_group.update({"questions": questions})
        question_groups.append(question_group)
    form_id = flow_form.get("surveyId")
    res = {
        "id": form_id,
        "form": flow_form.get("name"),
        "type": flow_form.get("type"),
        "question_groups": question_groups,
    }
    return res


for FORM in FORMS:
    form_url = FORM.get("url")
    form_type = FORM.get("type")
    form = r.get(f"{FLOW_ENDPOINT}{form_url}")
    form = form.json()
    form_id = form.get("surveyId")
    json_output = f"../../backend/source/forms/{form_id}.prod.json"
    existing_json = Path(json_output)
    existing_questions = []
    with open(json_output, "r") as existing_file:
        existing_json = json.load(existing_file)
        existing_questions = [
            q for qg in existing_json['question_groups']
            for q in qg['questions']
        ]
    form.update({"type": form_types[form_type]})
    form = tranform_form(form, existing_questions)
    json_object = json.dumps(form, indent=2)
    with open(json_output, "w") as outfile:
        outfile.write(json_object)
