from django.apps import AppConfig


class V1MobileConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api.v1.v1_mobile'

    def ready(self):
        import api.v1.v1_mobile.schema  # noqa
        return super().ready()
