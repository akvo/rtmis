from django.urls import re_path

from api.v1.v1_profile.views import (
    AdministrationAttributeViewSet,
    AdministrationViewSet,
    EntityDataViewSet,
    EntityViewSet,
    export_administrations_template,
    export_prefilled_administrations_template,
    send_feedback,
    export_entity_data,
)

urlpatterns = [
    re_path(
        r"^(?P<version>(v1))/export/administrations-template",
        export_administrations_template,
    ),
    re_path(
        r"^(?P<version>(v1))/export/prefilled-administrations-template",
        export_prefilled_administrations_template,
    ),
    re_path(r"^(?P<version>(v1))/export/entity-data", export_entity_data),
    re_path(
        r"^(?P<version>(v1))/administration-attributes/(?P<pk>[0-9]+)",
        AdministrationAttributeViewSet.as_view(
            {
                "put": "update",
                "delete": "destroy",
            }
        ),
        name="administration-attribute-detail",
    ),
    re_path(
        r"^(?P<version>(v1))/administration-attributes",
        AdministrationAttributeViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="administration-attribute-list",
    ),
    re_path(
        r"^(?P<version>(v1))/administrations/(?P<pk>[0-9]+)",
        AdministrationViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "delete": "destroy",
            }
        ),
        name="administrations-detail",
    ),
    re_path(
        r"^(?P<version>(v1))/administrations",
        AdministrationViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="administrations-list",
    ),
    re_path(
        r"^(?P<version>(v1))/entity-data/(?P<pk>[0-9]+)",
        EntityDataViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "delete": "destroy",
            }
        ),
        name="entity-data-list",
    ),
    re_path(
        r"^(?P<version>(v1))/entity-data",
        EntityDataViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="entity-data-list",
    ),
    re_path(
        r"^(?P<version>(v1))/entities/(?P<pk>[0-9]+)",
        EntityViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "delete": "destroy",
            }
        ),
        name="entities-list",
    ),
    re_path(
        r"^(?P<version>(v1))/entities",
        EntityViewSet.as_view(
            {
                "get": "list",
                "post": "create",
            }
        ),
        name="entities-list",
    ),
    re_path(r"^(?P<version>(v1))/feedback", send_feedback),
]
