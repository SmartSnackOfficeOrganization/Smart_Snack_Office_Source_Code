from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    ProductImageViewSet,
    ProductsViewSet,
    ReviewViewSet,
    TagViewSet,
)

router = DefaultRouter()

router.register(r"products", ProductsViewSet, basename="catalog")
router.register(
    r"products/(?P<product_id>[^/.]+)/images",
    ProductImageViewSet,
    basename="product-images",
)
router.register(
    r"products/(?P<product_id>[^/.]+)/reviews",
    ReviewViewSet,
    basename="product-reviews",
)
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"tags", TagViewSet, basename="tag")

urlpatterns = [path("", include(router.urls))]
