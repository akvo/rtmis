import json
import os

from django.core.management import BaseCommand
from jsmin import jsmin

from api.v1.v1_forms.constants import FormTypes
from api.v1.v1_forms.models import Forms
from api.v1.v1_profile.models import Levels, Administration


class Command(BaseCommand):
    def handle(self, *args, **options):
        # fetch all administrations
        all_administrations = {}
        adm = []
        administrations = Administration.objects.all()
        for a in administrations:
            all_administrations.update({a.name: {"id": a.id, "path": a.path}})
            adm.append({
                "id": a.id,
                "parent": a.parent_id,
                "name": a.name,
                "path": a.path,
                "full_name": a.administration_column
            })
        # add administration id to topojson
        topojson = open("source/kenya.topojson").read()
        topojson = json.loads(topojson)
        geometris_with_id = []
        for obj in topojson['objects']['kenya']['geometries']:
            key = obj['properties']['NAME_3']
            find_id = 0
            if key in all_administrations:
                find_id = all_administrations[key].get("id")
            obj['properties'].update({"SHAPE_ADMIN_ID": find_id})
            geometris_with_id.append(obj)
        topojson['objects']['kenya']['geometries'] = geometris_with_id
        # write new topojson file
        new_topojson_file = "source/kenya_with_admin_id.topojson"
        with open(new_topojson_file, "w") as outfile:
            json.dump(topojson, outfile)
        # write administration_file
        administration_json = "source/administration.json"
        with open(administration_json, "w") as outfile:
            json.dump(adm, outfile)

        # write config
        config_file = jsmin(open("source/config/config.js").read())
        levels = []
        forms = []
        for level in Levels.objects.all():
            levels.append({
                'id': level.id,
                'name': level.name,
                'level': level.level,
            })
        for form in Forms.objects.all():
            forms.append({
                'id': form.id,
                'name': form.name,
                'type': form.type,
                'version': form.version,
                'type_text': FormTypes.FieldStr.get(form.type),
            })
        min_config = jsmin("".join([
            "var dbadm=",
            open(administration_json).read(), ";",
            "var topojson=",
            open(new_topojson_file).read(), ";", "var levels=",
            json.dumps(levels), ";", "var forms=",
            json.dumps(forms), ";", config_file
        ]))
        open("source/config/config.min.js", 'w').write(min_config)
        os.remove(administration_json)
