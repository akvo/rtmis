"""rtmis URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path

from api.demo.views import login, dashboard, demo_test, import_country, list_country

urlpatterns = [
    # path('api/admin/', admin.site.urls),
    path('api/test/', demo_test),
    path('api/login/', login),
    path('api/dashboard/', dashboard),
    path('api/import/country/', import_country),
    path('api/list/country/', list_country),
]
