from django.urls import re_path

from api.v1.v1_forms.views import (
    web_form_details,
    list_form,
    form_data,
    check_form_approver,
    form_approver,
    FormCertificationAssignmentViewSet,
)


urlpatterns = [
    re_path(r"^(?P<version>(v1))/forms", list_form),
    re_path(r"^(?P<version>(v1))/form/(?P<form_id>[0-9]+)", form_data),
    re_path(
        r"^(?P<version>(v1))/form/web/(?P<form_id>[0-9]+)", web_form_details
    ),
    re_path(r"^(?P<version>(v1))/form/approver", form_approver),
    re_path(
        r"^(?P<version>(v1))/form/check-approver/(?P<form_id>[0-9]+)",
        check_form_approver,
    ),
    re_path(
        r"^(?P<version>(v1))/form/certification-assignment/(?P<pk>[0-9]+)",
        FormCertificationAssignmentViewSet.as_view(
            {"get": "retrieve", "put": "update", "delete": "destroy"}
        ),
    ),
    re_path(
        r"^(?P<version>(v1))/form/certification-assignment",
        FormCertificationAssignmentViewSet.as_view(
            {"get": "list", "post": "create"}
        ),
    ),
]
