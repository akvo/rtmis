from django.urls import re_path
from .views import get_mobile_form_assignment

urlpatterns = [
    re_path(r'^(?P<version>(v1))/mobile-form-assignment',
            get_mobile_form_assignment,
            name='mobile-form-assignment-list'),
]
