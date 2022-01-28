from django.urls import re_path

from api.v1.v1_users.views import health_check, login

urlpatterns = [
    re_path(r'^(?P<version>(v1))/health/check/', health_check),
    re_path(r'^(?P<version>(v1))/login/', login),
]
