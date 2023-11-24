from django.urls import re_path

from api.v1.v1_profile.views import (
        AdministrationAttributeViewSet, AdministrationViewSet, send_feedback)

urlpatterns = [
    re_path(
        r'^(?P<version>(v1))/administration-attributes/(?P<pk>[0-9]+)',
        AdministrationAttributeViewSet.as_view({
            'put': 'update',
            'delete': 'destroy',
            }),
        name='administration-attribute-detail'),
    re_path(
        r'^(?P<version>(v1))/administration-attributes',
        AdministrationAttributeViewSet.as_view({
            'get': 'list',
            'post': 'create',
            }),
        name='administration-attribute-list'),
    re_path(
        r'^(?P<version>(v1))/administrations/(?P<pk>[0-9]+)',
        AdministrationViewSet.as_view({
            'get': 'retrieve',
            'put': 'update',
            'delete': 'destroy',
            }),
        name='administrations-detail'),
    re_path(
        r'^(?P<version>(v1))/administrations',
        AdministrationViewSet.as_view({
            'get': 'list',
            'post': 'create',
            }),
        name='administrations-list'),
    re_path(r'^(?P<version>(v1))/feedback', send_feedback),
]
