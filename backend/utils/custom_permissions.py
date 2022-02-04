from rest_framework.permissions import BasePermission

from api.v1.v1_profile.constants import UserRoleTypes


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        if request.user.user_access.role == UserRoleTypes.admin:
            return True
        return False


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        if request.user.user_access.role == UserRoleTypes.super_admin:
            return True
        return False
