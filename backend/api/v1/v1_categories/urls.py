from django.urls import re_path
from api.v1.v1_categories.views import (
    get_data_with_category,
    get_raw_data_point,
    get_power_bi_data,
    get_raw_csv_data,
)

urlpatterns = [
    re_path(
        r"^(?P<version>(v1))/form-data-category/(?P<form_id>[0-9]+)",
        get_data_with_category,
    ),
    re_path(
        r"^(?P<version>(v1))/raw-data/(?P<form_id>[0-9]+)", get_raw_data_point
    ),
    re_path(
        r"^(?P<version>(v1))/power-bi/(?P<form_id>[0-9]+)", get_power_bi_data
    ),
    re_path(
        r"^(?P<version>(v1))/raw-data-csv/(?P<form_id>[0-9]+)",
        get_raw_csv_data,
    ),
]
