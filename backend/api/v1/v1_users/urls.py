from django.urls import re_path

from api.v1.v1_users.views import health_check, login, verify_invite, \
    set_user_password, list_administration, add_user, list_users, edit_user

urlpatterns = [
    re_path(r'^(?P<version>(v1))/health/check/', health_check),
    re_path(r'^(?P<version>(v1))/login/', login),
    re_path(r'^(?P<version>(v1))/verify/invite/', verify_invite),
    re_path(r'^(?P<version>(v1))/set/user/password/', set_user_password),
    re_path(r'^(?P<version>(v1))/administration/(?P<pk>[0-9]+)/',
            list_administration),
    re_path(r'^(?P<version>(v1))/add/user/', add_user),
    re_path(r'^(?P<version>(v1))/list/users/', list_users),
    re_path(r'^(?P<version>(v1))/edit/user/(?P<pk>[0-9]+)/', edit_user),
]
