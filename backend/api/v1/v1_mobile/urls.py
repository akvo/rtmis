from django.urls import re_path
from .views import MobileFormAssignmentListCreateView, \
    MobileFormAssignmentRetrieveUpdateDestroyView

urlpatterns = [
    re_path(r'^(?P<version>(v1))/mobile-form-assignment',
            MobileFormAssignmentListCreateView.as_view(),
            name='mobile-form-assignment-list-create'),
    re_path(r'^(?P<version>(v1))/mobile-form-assignment/<int:pk>/',
            MobileFormAssignmentRetrieveUpdateDestroyView.as_view(),
            name='mobile-form-assignment-retrieve-update-destroy')
]
