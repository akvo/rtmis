from django.urls import re_path
from .views import upload_images

urlpatterns = [
    re_path(r"^(?P<version>(v1))/upload/images", upload_images),
]
