import pandas as pd
import json
import os

dir_path = "../../../backend/source/forms"
files = [f for f in os.listdir(dir_path) if "prod.json" in f]

for file in files:
    file_path = os.path.join(dir_path, file)
    with open(file_path, 'r') as json_file:
        data = json.load(json_file)

    form_name = ("{0}-{1}").format(data["id"], data["form"].replace(" ", "_"))

    df_list = []
    for group_index, group in enumerate(data['question_groups']):
        for question in group['questions']:
            entry = {
                'Group': group_index + 1,
                'Group Name': group['question_group'],
                'ID': question['id'],
                'Question': question['question'],
                'Datapoint': "Yes" if question.get("meta") else "No",
                'Type': question['type'],
                'Required': "Yes" if question.get("required") else "No"
            }

            # Helper function to append the base entry with additional details
            def append_entry(base, opt=None, dep_id=None, dep_opt=None):
                new_entry = base.copy()
                if opt:
                    new_entry['Option'] = opt
                if dep_id:
                    new_entry['Dependency'] = dep_id
                    new_entry['Dependency Option'] = dep_opt
                df_list.append(new_entry)

            # If the question has options, iterate through each option
            if question.get('options'):
                for option in question['options']:
                    # Iterate through each dependency and its options
                    if question.get('dependency'):
                        for dependency in question['dependency']:
                            dep_id = dependency['id']
                            dep_option = ','.join(dependency['options'])
                            append_entry(entry, option['name'], dep_id,
                                         dep_option)
                    else:
                        append_entry(entry, option['name'])
            else:
                # If there's a dependency but no options
                if question.get('dependency'):
                    for dependency in question['dependency']:
                        dep_id = dependency['id']
                        dep_option = ','.join(dependency['options'])
                        append_entry(entry, None, dep_id, dep_option)
                else:
                    append_entry(entry)

    df = pd.DataFrame(df_list)
    multi_indexed_df = df.set_index([
        'Group',
        'Group Name',
        'ID',
        'Required',
        'Type',
        'Question',
        'Datapoint',
        'Dependency',
        'Dependency Option',
        'Option',
    ])

    multi_indexed_df.to_excel(f"./excel_forms/{form_name}.xlsx")
