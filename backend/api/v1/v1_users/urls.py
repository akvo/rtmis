from django.urls import re_path

from api.v1.v1_users.views import health_check, login, verify_invite

urlpatterns = [
    re_path(r'^(?P<version>(v1))/health/check/', health_check),
    re_path(r'^(?P<version>(v1))/login/', login),
    re_path(r'^(?P<version>(v1))/verify/invite/', verify_invite),

]
