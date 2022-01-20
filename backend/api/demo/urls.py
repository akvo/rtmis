from django.urls import path

from api.demo.views import login, dashboard, demo_test, import_country, list_country

urlpatterns = [
    path('test/', demo_test),
    path('login/', login),
    path('dashboard/', dashboard),
    path('import/country/', import_country),
    path('list/country/', list_country),
]
