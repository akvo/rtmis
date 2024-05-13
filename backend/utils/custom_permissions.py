from rest_framework.permissions import BasePermission

from api.v1.v1_profile.constants import UserRoleTypes


class IsSubmitter(BasePermission):
    def has_permission(self, request, view):
        if request.user.user_access.role == UserRoleTypes.user:
            return True
        return False


class IsApprover(BasePermission):
    def has_permission(self, request, view):
        if request.user.user_access.role == UserRoleTypes.approver:
            return True
        return False


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


class PublicGet(BasePermission):
    def has_permission(self, request, view):
        if request.method == "GET":
            return True
        if request.user.is_anonymous:
            return False
        if request.method == "DELETE":
            if request.user.user_access.role in [
                UserRoleTypes.super_admin,
                UserRoleTypes.admin,
            ]:
                return True
            return False
        if request.user.user_access.role in [
            UserRoleTypes.super_admin,
            UserRoleTypes.admin,
            UserRoleTypes.approver,
            UserRoleTypes.user,
        ]:
            return True
        return False
