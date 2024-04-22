from drf_spectacular.contrib.rest_framework_simplejwt import SimpleJWTScheme


class MobileAssignmentJWTScheme(SimpleJWTScheme):
    target_class = (
        "api.v1.v1_mobile.authentication.AssignmentAwareJWTAuthentication"
    )
