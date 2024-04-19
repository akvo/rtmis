from django.urls import re_path

from api.v1.v1_users.views import login, verify_invite, \
    set_user_password, list_administration, add_user, list_users, \
    get_profile, get_user_roles, list_levels, UserEditDeleteView, \
    forgot_password, list_organisations, add_organisation, \
    OrganisationEditDeleteView
from api.v1.v1_profile.views import list_entity_data

urlpatterns = [
    re_path(r'^(?P<version>(v1))/levels', list_levels),
    re_path(r'^(?P<version>(v1))/administration/(?P<administration_id>[0-9]+)',
            list_administration),
    re_path(r'^(?P<version>(v1))/profile', get_profile),
    re_path(r'^(?P<version>(v1))/login', login),
    re_path(r'^(?P<version>(v1))/users', list_users),
    re_path(r'^(?P<version>(v1))/user/(?P<user_id>[0-9]+)',
            UserEditDeleteView.as_view()),
    re_path(r'^(?P<version>(v1))/user/forgot-password', forgot_password),
    re_path(r'^(?P<version>(v1))/user/set-password', set_user_password),
    re_path(r'^(?P<version>(v1))/user/roles', get_user_roles),
    re_path(r'^(?P<version>(v1))/user', add_user),
    re_path(r'^(?P<version>(v1))/invitation/(?P<invitation_id>.*)$',
            verify_invite),
    re_path(r'^(?P<version>(v1))/organisations', list_organisations),
    re_path(r'^(?P<version>(v1))/organisation/(?P<organisation_id>[0-9]+)',
            OrganisationEditDeleteView.as_view()),
    re_path(r'^(?P<version>(v1))/organisation', add_organisation),
    re_path(
        (
            r'^(?P<version>(v1))/entity-data/'
            r'(?P<entity_id>[0-9]+)/list/(?P<administration_id>[0-9]+)'
        ),
        list_entity_data
    ),
]
