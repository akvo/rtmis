from django.urls import re_path
from .views import (
    get_mobile_forms,
    get_mobile_form_details,
    sync_pending_form_data,
    upload_image_form_device,
    download_sqlite_file,
    upload_apk_file,
    download_apk_file,
)

urlpatterns = [
    re_path(r"^(?P<version>(v1))/device/auth", get_mobile_forms),
    re_path(
        r"^(?P<version>(v1))/device/form/(?P<form_id>[0-9]+)", get_mobile_form_details
    ),
    re_path(r"^(?P<version>(v1))/device/sync", sync_pending_form_data),
    re_path(
        r"^(?P<version>(v1))/device/sqlite/(?P<file_name>.*)$", download_sqlite_file
    ),
    re_path(r"^(?P<version>(v1))/device/images", upload_image_form_device),
    re_path(r"^(?P<version>(v1))/device/apk/upload", upload_apk_file),
    re_path(r"^(?P<version>(v1))/device/apk/download", download_apk_file),
]
