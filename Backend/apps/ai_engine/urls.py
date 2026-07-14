"""
Rutas de la app ``ai_engine``.

Se incluye desde ``main_app/urls.py`` bajo el prefijo ``api/catalog/`` para
mantener el endpoint público en ``/api/catalog/search/``:

    path("api/catalog/", include("apps.ai_engine.urls")),
"""

from django.urls import path

from .search_views import ProductSearchView

urlpatterns = [
    path("search/", ProductSearchView.as_view(), name="product_search"),
]
