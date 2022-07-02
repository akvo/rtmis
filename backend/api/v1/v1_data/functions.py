import re
from datetime import datetime
from django.db import transaction, connection
from django.core.cache import cache
from django.http import HttpResponse


@transaction.atomic
def refresh_materialized_data():
    with connection.cursor() as cursor:
        cursor.execute("""
            REFRESH MATERIALIZED VIEW view_data_options;""")


def get_cache(name, as_middleware=True):
    name = re.sub(r'[\W_]+', '_', name)
    today = datetime.now().strftime("%Y%m%d")
    cache_name = f"{today}-{name}"
    data = cache.get(cache_name)
    if data:
        return HttpResponse(cache, content_type="application/json;")
    return None


def create_cache(name, resp):
    name = re.sub(r'[\W_]+', '_', name)
    today = datetime.now().strftime("%Y%m%d")
    cache_name = f"{today}-{name}"
    cache.add(cache_name, resp)
