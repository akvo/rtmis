from django.urls import re_path

from api.v1.v1_data.views import submit_form

urlpatterns = [
    re_path(r'^(?P<version>(v1))/form-data/(?P<pk>[0-9]+)/', submit_form),
]
