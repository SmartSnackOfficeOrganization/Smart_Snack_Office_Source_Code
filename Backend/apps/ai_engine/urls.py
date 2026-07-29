"""
Rutas de la app ``ai_engine``.

Se incluye desde ``main_app/urls.py`` bajo el prefijo ``api/catalog/``:

    path("api/catalog/", include("apps.ai_engine.urls")),
"""

from django.urls import path

from .recommendation_views import ProductRecommendationsView
from .search_views import ProductSearchView

urlpatterns = [
    path("search/", ProductSearchView.as_view(), name="product_search"),
    path(
        "recommendations/",
        ProductRecommendationsView.as_view(),
        name="product_recommendations",
    ),
]
