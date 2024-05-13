from datetime import timedelta
from typing import cast
from django.contrib.auth.models import AnonymousUser
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.authentication import JWTAuthentication

from api.v1.v1_mobile.models import MobileAssignment


class MobileAssignmentToken(AccessToken):
    token_type = "mobile_assignment"
    lifetime = timedelta(days=99999)

    @classmethod
    def for_assignment(cls, assignment):
        assert isinstance(assignment, MobileAssignment)
        token = cls()
        token["assignment_id"] = assignment.id
        return token

    @classmethod
    def for_user(cls, _):
        raise NotImplementedError(
            ".for_user() is not used on this token type."
        )

    @property
    def assignment(self):
        if not hasattr(self, "_assignment"):
            self._assignment = self._get_assignment()
        return self._assignment

    def _get_assignment(self):
        assignment_id = self.payload.get("assignment_id", None)
        return (
            MobileAssignment.objects.get(id=assignment_id)
            if assignment_id
            else None
        )

    def check_exp(self, claim="exp", current_time=None):
        """
        Make sure token never expires
        """
        pass


class AssignmentAwareJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        if isinstance(validated_token, MobileAssignmentToken):
            return AnonymousUser()
        return super().get_user(validated_token)


class IsMobileAssignment(BasePermission):
    def has_permission(self, request: Request, view):
        if not isinstance(request.auth, MobileAssignmentToken):
            return False
        user = cast(MobileAssignment, request.auth.assignment).user
        return user.is_active
