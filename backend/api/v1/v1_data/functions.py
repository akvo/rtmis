import re
import json
from datetime import datetime
from django.db import transaction, connection
from django.core.cache import cache
from django.http import HttpResponse
from rtmis.settings import CACHE_FOLDER


@transaction.atomic
def refresh_materialized_data():
    with connection.cursor() as cursor:
        cursor.execute("""
            REFRESH MATERIALIZED VIEW view_data_options;""")


def get_cache(name, as_middleware=True):
    name = re.sub(r'[\W_]+', '_', name)
    today = datetime.now().strftime("%Y%m%d")
    cache_name = f"{CACHE_FOLDER}{today}-{name}.json"
    data = cache.get(cache_name)
    if data:
        return HttpResponse(cache, content_type="application/json;")
    return None


def create_cache(name, resp):
    name = re.sub(r'[\W_]+', '_', name)
    today = datetime.now().strftime("%Y%m%d")
    cache_name = f"{CACHE_FOLDER}{today}-{name}.json"
    cache.add(cache_name, resp)
    json_cache = json.dumps(resp, separators=(',', ":"))
    with open(cache_name, "w") as outfile:
        outfile.write(json_cache)
