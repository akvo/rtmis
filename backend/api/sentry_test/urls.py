from django.urls import path


def trigger_error(request):
    division_by_zero = 1 / 0
    return division_by_zero


urlpatterns = [
    path("sentry-debug/", trigger_error),
]
