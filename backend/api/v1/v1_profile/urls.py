from django.urls import re_path

from api.v1.v1_profile.views import send_feedback

urlpatterns = [
    re_path(r'^(?P<version>(v1))/feedback', send_feedback),
]
