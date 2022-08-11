from django.urls import re_path

from api.v1.v1_forms.views import web_form_details, list_form, form_data, \
    edit_form_type, edit_form_approval, check_form_approver, \
    form_approval_level, form_approval_level_administration, form_approver


urlpatterns = [
    re_path(r'^(?P<version>(v1))/forms', list_form),
    re_path(r'^(?P<version>(v1))/form/(?P<form_id>[0-9]+)',
            form_data),
    re_path(r'^(?P<version>(v1))/form/web/(?P<form_id>[0-9]+)',
            web_form_details),
    re_path(r'^(?P<version>(v1))/form/approver', form_approver),

    re_path(r'^(?P<version>(v1))/form/approval-level/'
            r'(?P<administration_id>[0-9]+)',
            form_approval_level_administration),
    re_path(r'^(?P<version>(v1))/form/approval-level', form_approval_level),
    re_path(r'^(?P<version>(v1))/form/approval', edit_form_approval),
    re_path(r'^(?P<version>(v1))/form/type', edit_form_type),

]
