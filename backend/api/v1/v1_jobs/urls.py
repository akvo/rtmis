from django.urls import re_path

from api.v1.v1_jobs.views import download_generate, job_check

urlpatterns = [
    re_path(r'^(?P<version>(v1))/download/generate', download_generate),
    re_path(r'^(?P<version>(v1))/job/check', job_check),
]
