from decimal import Decimal

from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.orders.models import Order, OrderItem

from .models import Cart, CartItem


def get_or_create_cart(buyer) -> Cart:
    cart, _ = Cart.objects.get_or_create(buyer=buyer)
    return cart


def add_product_to_cart(*, cart: Cart, product, quantity: int) -> CartItem:
    """
    Add or increment a cart line with stock checks and price snapshot.
    Mirrors CartItemSerializer.create without HTTP/allergy context.
    """
    if quantity < 1:
        raise ValidationError("Quantity must be greater than or equal to 1.")

    with transaction.atomic():
        Cart.objects.select_for_update().get(pk=cart.pk)
        existing_item = (
            CartItem.objects.select_for_update()
            .filter(cart=cart, product=product)
            .first()
        )
        if existing_item:
            new_quantity = existing_item.quantity + quantity
            if new_quantity > product.stock:
                raise ValidationError("Quantity exceeds available stock.")
            existing_item.quantity = new_quantity
            existing_item.unit_price = product.price
            existing_item.save(update_fields=["quantity", "unit_price"])
            return existing_item

        if quantity > product.stock:
            raise ValidationError("Quantity exceeds available stock.")

        return CartItem.objects.create(
            cart=cart,
            product=product,
            quantity=quantity,
            unit_price=product.price,
        )


def create_order_from_cart(buyer) -> Order:
    """
    Create a pending_payment order from the buyer's cart and clear cart items.
    Raises ValidationError when profile/address is missing or cart is empty.
    """
    profile = getattr(buyer, "buyer_profile", None)
    if not profile or not profile.delivery_address:
        raise ValidationError(
            "Debes configurar una dirección de entrega en tu perfil antes de confirmar el pedido."
        )

    cart = get_or_create_cart(buyer)
    cart_items = CartItem.objects.filter(cart=cart).select_related("product__seller")

    if not cart_items:
        raise ValidationError("El carrito está vacío.")

    with transaction.atomic():
        subtotal = sum(
            Decimal(str(item.unit_price)) * item.quantity for item in cart_items
        )
        tax = (subtotal * Decimal("0.19")).quantize(Decimal("0.01"))
        total = subtotal + tax

        order = Order.objects.create(
            buyer=buyer,
            status="pending_payment",
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

    return order
