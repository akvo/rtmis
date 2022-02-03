from django.urls import re_path

from api.v1.v1_forms.views import form_details, list_form, submit_form

urlpatterns = [
    re_path(r'^(?P<version>(v1))/form/(?P<pk>[0-9]+)/',
            form_details),
    re_path(r'^(?P<version>(v1))/forms/', list_form),
    re_path(r'^(?P<version>(v1))/form-data/(?P<pk>[0-9]+)/', submit_form),
]
