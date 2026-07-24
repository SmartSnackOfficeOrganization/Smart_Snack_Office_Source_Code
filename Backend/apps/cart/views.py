from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.authentication.models import Order, OrderItem
from apps.authentication.serializers import OrderSerializer

from .models import Cart, CartItem
from .permissions import isBuyer
from .serializers import CartItemSerializer


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
            context["cart"] = self._get_or_create_cart()
        return context

    def _get_or_create_cart(self):
        cart, _ = Cart.objects.get_or_create(buyer=self.request.user)
        return cart

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
        buyer = request.user
        profile = getattr(buyer, "buyer_profile", None)
        if not profile or not profile.delivery_address:
            return Response(
                {
                    "detail": "Debes configurar una dirección de entrega en tu perfil antes de confirmar el pedido."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart = self._get_or_create_cart()
        cart_items = CartItem.objects.filter(cart=cart).select_related(
            "product__seller"
        )

        if not cart_items:
            return Response(
                {"detail": "El carrito está vacío."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            subtotal = sum(
                Decimal(str(item.unit_price)) * item.quantity for item in cart_items
            )
            tax = (subtotal * Decimal("0.19")).quantize(Decimal("0.01"))
            total = subtotal + tax

            order = Order.objects.create(
                buyer=buyer,
                status="paid",
                delivery_address=profile.delivery_address,
                subtotal=subtotal,
                tax=tax,
                total=total,
            )

            for item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    seller=item.product.seller,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    subtotal=Decimal(str(item.unit_price)) * item.quantity,
                )

            cart_items.delete()

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )
