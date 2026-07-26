from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import timedelta
from django.utils import timezone
from apps.catalog.models import Product
from apps.orders.models import Order, OrderItem

from .models import Cart, CartItem

User = get_user_model()


def make_user(email, role, full_name="Usuario de prueba", password="Sup3rSecret1"):
    return User.objects.create_user(
        email=email,
        full_name=full_name,
        role=role,
        password=password,
        is_active=True,
    )


class CartItemAPITests(APITestCase):
    def setUp(self):
        self.buyer = make_user("buyer_cart@test.com", role="buyer")
        self.other_buyer = make_user("buyer_cart_2@test.com", role="buyer")
        self.seller = make_user("seller_cart@test.com", role="seller")

        self.product = Product.objects.create(
            seller=self.seller,
            name="Granola premium",
            price=Decimal("12.50"),
            stock=10,
            status="active",
        )

        self.items_url = reverse("cart-items-list")
        self.clear_url = reverse("cart-items-clear")

    def test_add_item_creates_cart_and_item(self):
        self.client.force_authenticate(user=self.buyer)

        response = self.client.post(
            self.items_url,
            {"product_id": str(self.product.id), "quantity": 2},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertTrue(Cart.objects.filter(buyer=self.buyer).exists())
        self.assertEqual(CartItem.objects.filter(cart__buyer=self.buyer).count(), 1)
        item = CartItem.objects.get(cart__buyer=self.buyer, product=self.product)
        self.assertEqual(item.quantity, 2)

    def test_add_same_product_accumulates_quantity(self):
        self.client.force_authenticate(user=self.buyer)

        self.client.post(
            self.items_url,
            {"product_id": str(self.product.id), "quantity": 2},
            format="json",
        )
        response = self.client.post(
            self.items_url,
            {"product_id": str(self.product.id), "quantity": 3},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(CartItem.objects.filter(cart__buyer=self.buyer).count(), 1)
        item = CartItem.objects.get(cart__buyer=self.buyer, product=self.product)
        self.assertEqual(item.quantity, 5)

    def test_add_existing_product_rejects_when_exceeds_stock(self):
        self.client.force_authenticate(user=self.buyer)

        self.client.post(
            self.items_url,
            {"product_id": str(self.product.id), "quantity": 8},
            format="json",
        )
        response = self.client.post(
            self.items_url,
            {"product_id": str(self.product.id), "quantity": 3},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        item = CartItem.objects.get(cart__buyer=self.buyer, product=self.product)
        self.assertEqual(item.quantity, 8)

    def test_update_item_quantity(self):
        self.client.force_authenticate(user=self.buyer)
        create_response = self.client.post(
            self.items_url,
            {"product_id": str(self.product.id), "quantity": 2},
            format="json",
        )
        detail_url = reverse("cart-items-detail", args=[create_response.data["id"]])

        response = self.client.patch(detail_url, {"quantity": 7}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        item = CartItem.objects.get(pk=create_response.data["id"])
        self.assertEqual(item.quantity, 7)

    def test_update_item_rejects_when_exceeds_stock(self):
        self.client.force_authenticate(user=self.buyer)
        create_response = self.client.post(
            self.items_url,
            {"product_id": str(self.product.id), "quantity": 2},
            format="json",
        )
        detail_url = reverse("cart-items-detail", args=[create_response.data["id"]])

        response = self.client.patch(detail_url, {"quantity": 20}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        item = CartItem.objects.get(pk=create_response.data["id"])
        self.assertEqual(item.quantity, 2)

    def test_delete_item(self):
        self.client.force_authenticate(user=self.buyer)
        create_response = self.client.post(
            self.items_url,
            {"product_id": str(self.product.id), "quantity": 2},
            format="json",
        )
        detail_url = reverse("cart-items-detail", args=[create_response.data["id"]])

        response = self.client.delete(detail_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            CartItem.objects.filter(pk=create_response.data["id"]).exists()
        )

    def test_delete_item_from_another_user_cart_returns_404(self):
        cart = Cart.objects.create(buyer=self.other_buyer)
        item = CartItem.objects.create(
            cart=cart,
            product=self.product,
            quantity=1,
            unit_price=self.product.price,
        )

        self.client.force_authenticate(user=self.buyer)
        detail_url = reverse("cart-items-detail", args=[item.id])
        response = self.client.delete(detail_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(CartItem.objects.filter(pk=item.id).exists())

    def test_clear_cart(self):
        self.client.force_authenticate(user=self.buyer)
        self.client.post(
            self.items_url,
            {"product_id": str(self.product.id), "quantity": 2},
            format="json",
        )
        other_product = Product.objects.create(
            seller=self.seller,
            name="Mix frutos secos",
            price=Decimal("9.99"),
            stock=5,
            status="active",
        )
        self.client.post(
            self.items_url,
            {"product_id": str(other_product.id), "quantity": 1},
            format="json",
        )

        response = self.client.delete(self.clear_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(CartItem.objects.filter(cart__buyer=self.buyer).count(), 0)


def test_checkout_creates_order_as_pending_payment_not_paid(self):
    from apps.authentication.models import (  # ajusta el import si vive en otro módulo
        BuyerProfile,
    )

    BuyerProfile.objects.get_or_create(
        user=self.buyer, defaults={"delivery_address": "Calle 123 #45-67"}
    )
    self.client.force_authenticate(user=self.buyer)
    self.client.post(
        self.items_url,
        {"product_id": str(self.product.id), "quantity": 2},
        format="json",
    )

    response = self.client.post("/api/cart/items/checkout/")

    self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
    order = Order.objects.get(id=response.data["id"])
    self.assertEqual(order.status, "pending_payment")


def test_checkout_does_not_decrement_stock_directly(self):

    from apps.authentication.models import BuyerProfile

    BuyerProfile.objects.get_or_create(
        user=self.buyer, defaults={"delivery_address": "Calle 123 #45-67"}
    )
    self.client.force_authenticate(user=self.buyer)
    self.client.post(
        self.items_url,
        {"product_id": str(self.product.id), "quantity": 2},
        format="json",
    )
    initial_stock = self.product.stock

    self.client.post("/api/cart/items/checkout/")

    self.product.refresh_from_db()
    self.assertEqual(self.product.stock, initial_stock)

class StockReservationTests(APITestCase):
    def setUp(self):
        self.buyer = make_user("reserva_buyer@test.com", role="buyer")
        self.seller = make_user("reserva_seller@test.com", role="seller")
        from apps.authentication.models import BuyerProfile  # ajusta si vive en otro módulo
        BuyerProfile.objects.get_or_create(
            user=self.buyer, defaults={"delivery_address": "Calle 123 #45-67"}
        )
        self.product = Product.objects.create(
            seller=self.seller, name="Barra", price=Decimal("1000.00"),
            stock=5, status="active",
        )
        self.items_url = reverse("cart-items-list")

    def _add_to_cart_and_checkout(self, quantity=2):
        self.client.force_authenticate(user=self.buyer)
        self.client.post(
            self.items_url,
            {"product_id": str(self.product.id), "quantity": quantity},
            format="json",
        )
        return self.client.post("/api/cart/items/checkout/")

    def test_checkout_reserves_stock_immediately(self):
        initial_stock = self.product.stock
        response = self._add_to_cart_and_checkout(quantity=2)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, initial_stock - 2)

    def test_checkout_sets_reservation_expiry(self):
        response = self._add_to_cart_and_checkout(quantity=1)
        order = Order.objects.get(id=response.data["id"])

        self.assertIsNotNone(order.stock_reserved_until)
        self.assertGreater(order.stock_reserved_until, timezone.now())
        self.assertLess(order.stock_reserved_until, timezone.now() + timedelta(minutes=16))

    def test_checkout_rejects_when_insufficient_stock(self):
        response = self._add_to_cart_and_checkout(quantity=999)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)  # sin cambios


class LazyExpirationTests(APITestCase):
    def setUp(self):
        self.buyer = make_user("expira_buyer@test.com", role="buyer")
        self.seller = make_user("expira_seller@test.com", role="seller")
        self.product = Product.objects.create(
            seller=self.seller, name="Chips", price=Decimal("2000.00"),
            stock=10, status="active",
        )
        self.order = Order.objects.create(
            buyer=self.buyer, status="pending_payment",
            delivery_address="Calle 123", subtotal=Decimal("4000.00"),
            total=Decimal("4000.00"),
            stock_reserved_until=timezone.now() - timedelta(minutes=1),  # ya vencida
        )
        OrderItem.objects.create(
            order=self.order, product=self.product, seller=self.seller,
            quantity=2, unit_price=Decimal("2000.00"), subtotal=Decimal("4000.00"),
        )
        self.product.stock -= 2  # simula que ya se había reservado
        self.product.save(update_fields=["stock"])

    def test_checking_status_releases_expired_reservation(self):
        self.client.force_authenticate(user=self.buyer)
        response = self.client.get(f"/api/payments/status/{self.order.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.product.refresh_from_db()
        self.assertEqual(self.order.status, "payment_failed")
        self.assertEqual(self.product.stock, 10)  # se liberó

    def test_non_expired_reservation_is_not_released(self):
        self.order.stock_reserved_until = timezone.now() + timedelta(minutes=10)
        self.order.save(update_fields=["stock_reserved_until"])

        self.client.force_authenticate(user=self.buyer)
        self.client.get(f"/api/payments/status/{self.order.id}/")

        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "pending_payment")  # sin cambios

    def test_initiate_checkout_releases_and_rejects_expired_order(self):
        self.client.force_authenticate(user=self.buyer)
        response = self.client.post(
            "/api/payments/checkout/", {"order_id": str(self.order.id)}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.order.refresh_from_db()
        self.product.refresh_from_db()
        self.assertEqual(self.order.status, "payment_failed")
        self.assertEqual(self.product.stock, 10)