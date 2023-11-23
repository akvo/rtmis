from django.urls import re_path

from api.v1.v1_profile.views import send_feedback, AdministrationViewSet

urlpatterns = [
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
