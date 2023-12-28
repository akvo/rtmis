from django.urls import re_path

from api.v1.v1_jobs.views import download_generate, download_status, \
    download_file, download_list, upload_bulk_administrators, upload_excel

urlpatterns = [
    re_path(r'^(?P<version>(v1))/download/generate', download_generate),
    re_path(r'^(?P<version>(v1))/download/status/(?P<task_id>.*)$',
            download_status),
    re_path(r'^(?P<version>(v1))/download/file/(?P<file_name>.*)$',
            download_file),
    re_path(r'^(?P<version>(v1))/download/list', download_list),
    re_path(r'^(?P<version>(v1))/upload/excel/(?P<form_id>[0-9]+)',
            upload_excel),
    re_path(r'^(?P<version>(v1))/upload/bulk-administrations',
            upload_bulk_administrators)
]
