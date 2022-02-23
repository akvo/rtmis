from django.core.management import BaseCommand
from jsmin import jsmin


class Command(BaseCommand):

    def handle(self, *args, **options):
        config_file = jsmin(open("source/config/config.js").read())
        min_config = jsmin("".join([
            "var topojson=",
            open("source/kenya.topojson").read(),
            ";", config_file
        ]))
        open("source/config/config.min.js", 'w').write(min_config)
