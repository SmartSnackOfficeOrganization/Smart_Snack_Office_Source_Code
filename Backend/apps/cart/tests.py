from decimal import Decimal

from apps.catalog.models import Product
from apps.orders.models import Order
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

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

        response = self.client.post("/api/cart/items/checkout/")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        order = Order.objects.get(id=response.data["id"])
        self.assertEqual(order.status, "pending_payment")

    def test_checkout_does_not_decrement_stock_directly(self):
        """El stock solo se descuenta vía Order.mark_as_paid(), nunca
        directamente en el checkout del carrito."""
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

        response = self.client.post("/api/cart/items/checkout/")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, initial_stock)
