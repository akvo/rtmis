import json

from django.core.management import BaseCommand
from jsmin import jsmin

from api.v1.v1_forms.constants import FormTypes
from api.v1.v1_forms.models import Forms
from api.v1.v1_profile.models import Levels


class Command(BaseCommand):

    def handle(self, *args, **options):
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
            "var topojson=", open("source/kenya.topojson").read(), ";",
            "var levels=", json.dumps(levels), ";",
            "var forms=", json.dumps(forms), ";",
            config_file
        ]))
        open("source/config/config.min.js", 'w').write(min_config)
