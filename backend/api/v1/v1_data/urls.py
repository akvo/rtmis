from django.urls import re_path

from api.v1.v1_data.views import submit_form, list_form_data, data_answers, \
    get_map_data_point, get_chart_data_point, list_pending_form_data, \
    pending_data_answers

urlpatterns = [
    re_path(r'^(?P<version>(v1))/form-data/(?P<pk>[0-9]+)/', submit_form),
    re_path(r'^(?P<version>(v1))/list/form-data/(?P<pk>[0-9]+)/',
            list_form_data),
    re_path(r'^(?P<version>(v1))/data/(?P<pk>[0-9]+)/',
            data_answers),
    re_path(r'^(?P<version>(v1))/maps/(?P<pk>[0-9]+)/',
            get_map_data_point),
    re_path(r'^(?P<version>(v1))/chart/data/(?P<pk>[0-9]+)/',
            get_chart_data_point),
    re_path(r'^(?P<version>(v1))/list/pending/form-data/(?P<pk>[0-9]+)/',
            list_pending_form_data),
    re_path(r'^(?P<version>(v1))/list/pending/answers/(?P<pk>[0-9]+)/',
            pending_data_answers),
]
