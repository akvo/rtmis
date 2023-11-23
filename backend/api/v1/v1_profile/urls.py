from django.urls import re_path, include

from api.v1.v1_profile.views import send_feedback, AdministrationViewSet
# from rest_framework.routers import DefaultRouter

# router = DefaultRouter()
# router.register('administrations', AdministrationViewSet, basename='administrations')

urlpatterns = [
    # re_path(r'^(?P<version>(v1))/', include(router.urls)),
    # detail routes needs to be before list route or it won't work
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
