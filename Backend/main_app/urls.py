"""
URL configuration for mi_proyecto_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
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

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework_simplejwt.views import (
    TokenBlacklistView,
    TokenRefreshView,
    TokenVerifyView,
)


class NoThrottleTokenRefreshView(TokenRefreshView):
    throttle_classes = []


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.authentication.urls")),
    path(
        "api/token/refresh/", NoThrottleTokenRefreshView.as_view(), name="token_refresh"
    ),
    path("api/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("api/token/blacklist/", TokenBlacklistView.as_view(), name="token_blacklist"),
    path("api/catalog/", include("apps.catalog.urls")),
    path("api/catalog/", include("apps.ai_engine.urls")),
    path("api/cart/", include("apps.cart.urls")),
    path("api/", include("apps.orders.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path('health/', lambda r: JsonResponse({"status": "ok"})),
]
