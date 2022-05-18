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
            # get user detail
            user = SystemUser.objects.get(email=request.user)
            # calculate last activity
            now = timezone.now()
            last_active = user.last_login
            time_diff_hours = None
            if last_active:
                time_diff = now - last_active
                time_diff_hours = time_diff.total_seconds()
                # / 3600
            if time_diff_hours and time_diff_hours >= 2:
                # revoke after 2 hours inactivity
                # reset last active
                user.last_login = None
            else:
                # update last login here
                user.last_login = timezone.now()
            user.save()
            return response
        except SystemUser.DoesNotExist:
            return response
