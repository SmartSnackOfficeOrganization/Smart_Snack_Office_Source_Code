from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ProductImageViewSet, ProductsViewSet

router = DefaultRouter()

router.register(r"products", ProductsViewSet, basename="catalog")
router.register(
    r"products/(?P<product_id>[^/.]+)/images",
    ProductImageViewSet,
    basename="product-images",
)

urlpatterns = [path("", include(router.urls))]
