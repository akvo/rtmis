import re
import os
from pathlib import Path
import msgpack
from datetime import datetime
from django.db import transaction, connection
from django.http import HttpResponse
from rtmis.settings import CACHE_FOLDER


@transaction.atomic
def refresh_materialized_data():
    with connection.cursor() as cursor:
        cursor.execute("""
            REFRESH MATERIALIZED VIEW view_data_options;
            REFRESH MATERIALIZED VIEW view_options;
            """)


def get_cache(name):
    name = re.sub(r'[\W_]+', '_', name)
    today = datetime.now().strftime("%Y%m%d")
    cache_name = f"{CACHE_FOLDER}{today}-{name}.msgpack"
    if Path(cache_name).exists():
        with open(cache_name, "rb") as data_file:
            byte_data = data_file.read()
            data_loaded = msgpack.unpackb(byte_data)
            return HttpResponse(data_loaded, content_type="application/json;")
    return None


def create_cache(name, resp):
    name = re.sub(r'[\W_]+', '_', name)
    today = datetime.now().strftime("%Y%m%d")
    cache_name = f"{today}-{name}"
    if not Path(CACHE_FOLDER).exists():
        os.mkdir(CACHE_FOLDER)
    with open(f"{CACHE_FOLDER}{cache_name}.msgpack", "wb") as outfile:
        packed = msgpack.packb(resp)
        outfile.write(packed)
