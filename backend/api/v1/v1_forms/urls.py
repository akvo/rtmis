from django.urls import re_path

from api.v1.v1_forms.views import web_form_details, list_form, form_data, \
    edit_form_type, edit_form_approval, approval_form_users

urlpatterns = [
    re_path(r'^(?P<version>(v1))/web/form/(?P<pk>[0-9]+)/',
            web_form_details),
    re_path(r'^(?P<version>(v1))/forms/', list_form),
    re_path(r'^(?P<version>(v1))/form/(?P<pk>[0-9]+)/',
            form_data),
    re_path(r'^(?P<version>(v1))/edit/forms/', edit_form_type),
    re_path(r'^(?P<version>(v1))/edit/form/approval/', edit_form_approval),
    re_path(r'^(?P<version>(v1))/approval/form/(?P<pk>[0-9]+)/',
            approval_form_users),
]
