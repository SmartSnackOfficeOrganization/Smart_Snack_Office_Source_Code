from apps.orders.serializers import OrderSerializer
from django.db.models import Sum
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import CartItem
from .permissions import isBuyer
from .serializers import CartItemSerializer
from .services import create_order_from_cart, get_or_create_cart


class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated, isBuyer]

    def get_queryset(self):
        return CartItem.objects.filter(cart__buyer=self.request.user).select_related(
            "product"
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.request and self.request.user.is_authenticated:
            context["cart"] = get_or_create_cart(self.request.user)
        return context

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        totals = queryset.aggregate(total_items=Sum("quantity"))
        return Response(
            {
                "items": serializer.data,
                "total_items": totals.get("total_items") or 0,
            }
        )

    @action(detail=False, methods=["delete"], url_path="clear")
    def clear(self, request):
        queryset = self.get_queryset()
        deleted_count, _ = queryset.delete()
        return Response(
            {"message": "Cart cleared successfully.", "deleted_items": deleted_count},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="checkout")
    def checkout(self, request):
        try:
            order = create_order_from_cart(request.user)
        except ValidationError as exc:
            detail = exc.detail
            if isinstance(detail, list) and len(detail) == 1:
                detail = detail[0]
            return Response({"detail": detail}, status=status.HTTP_400_BAD_REQUEST)

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
