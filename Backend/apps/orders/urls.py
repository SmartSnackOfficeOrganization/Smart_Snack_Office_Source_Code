from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import BuyerOrderViewSet, OrderViewSet

router = SimpleRouter()
router.register(r"orders", OrderViewSet, basename="orders")
router.register(r"my-orders", BuyerOrderViewSet, basename="my-orders")

urlpatterns = [
    path("", include(router.urls)),
]
