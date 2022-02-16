from django.urls import re_path

from api.v1.v1_forms.views import web_form_details, list_form, form_data

urlpatterns = [
    re_path(r'^(?P<version>(v1))/web/form/(?P<pk>[0-9]+)/',
            web_form_details),
    re_path(r'^(?P<version>(v1))/forms/', list_form),
    re_path(r'^(?P<version>(v1))/form/(?P<pk>[0-9]+)/',
            form_data),
]
