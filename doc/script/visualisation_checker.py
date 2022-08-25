#!/usr/bin/env python
# coding: utf-8

import json
import pandas as pd
from datetime import datetime


def intersection(lst1, lst2):
    lst3 = [value for value in lst1 if value in lst2]
    return lst3


with open('../../backend/source/config/visualisation.json', 'r') as vs:
    config = json.load(vs)

form_config = []
df = []
for c in config:
    with open(f"../../backend/source/forms/{c['id']}.prod.json", 'r') as fr:
        form = json.load(fr)
    questions = [q for qg in form['question_groups'] for q in qg['questions']]
    criteria = list(filter(lambda x: x['type'] == "CRITERIA", c['charts']))
    category = []
    for cr in criteria:
        criterias = []
        for co in cr['options']:
            opts = []
            for io, o in enumerate(co['options']):
                option = o['option']
                option.sort()
                opt = {'question': o['question'], 'option': option}
                question = list(
                    filter(lambda x: x['id'] == o['question'], questions))
                if not question:
                    print('QUESTION ID NOT FOUND:', c['title'], '-',
                          cr['title'], '-', co['name'], ':', o['question'])
                    break
                available_options = [
                    ao['name'] for ao in question[0]['options']
                ]
                for op in option:
                    if op not in available_options:
                        print('OPTIONS NOT FOUND:', c['title'], '-',
                              cr['title'], '-', co['name'], ':', o['question'],
                              op)
                    gr = o.get('group')
                    df.append({
                        'form_name': c['title'],
                        'question_id': o['question'],
                        'criteria': cr['title'],
                        'category': co['name'],
                        'option (OR)': op,
                        'group': f"{gr} OR" if gr else "AND"
                    })
                opts.append(opt)
            for prev in criterias:
                duplicate = intersection(opts, prev['options'])
                if len(duplicate) == len(opts):
                    print('POTENTIAL DUPLICATE:', c['title'], '-', cr['title'],
                          ':', prev['category'], '&', co['name'])
                if len(prev['options']) == len(duplicate):
                    print('POTENTIAL DUPLICATE:', c['title'], '-', cr['title'],
                          ':', prev['category'], '&', co['name'])
            criterias.append({'category': co['name'], 'options': opts})
        category.append({'name': cr['title'], 'criteria': criterias})
    form_config.append({
        'id': c['id'],
        'name': c['title'],
        'category': category
    })

df = pd.DataFrame(df)
today = datetime.now().strftime("%Y-%m-%d")
df.groupby([
    'form_name', 'criteria', 'category', 'group', 'question_id', 'option (OR)'
]).first().to_excel(f"./jmp_criteria_{today}.xlsx")
