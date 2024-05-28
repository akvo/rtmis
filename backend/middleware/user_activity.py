from django.utils import timezone

# from rest_framework.response import Response
# from rest_framework import status
from api.v1.v1_users.models import SystemUser


class UserActivity(object):
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        try:
            # auth_header = request.headers.get('Authorization')
            # get user detail
            user = SystemUser.objects.get(email=request.user)
            # update last login here
            user.last_login = timezone.now()
            user.save()
            return response
        except SystemUser.DoesNotExist:
            return response
