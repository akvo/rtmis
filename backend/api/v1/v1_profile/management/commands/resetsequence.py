from django.core.management.base import AppCommand
from django.core.management.color import no_style
from django.db import DEFAULT_DB_ALIAS, connections, transaction


class Command(AppCommand):
    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument("--database", default=DEFAULT_DB_ALIAS)

    def handle_app_config(self, app_config, **options):
        if app_config.models_module is None:
            return
        connection = connections[options["database"]]
        models = app_config.get_models(include_auto_created=True)
        statements = connection.ops.sequence_reset_sql(no_style(), models)

        with transaction.atomic():
            with connection.cursor() as cursor:
                for sql in statements:
                    cursor.execute(sql)
