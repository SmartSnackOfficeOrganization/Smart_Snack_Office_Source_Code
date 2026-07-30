"""
Pruebas del endpoint de recomendaciones (HU-07 / Item-Based CF).

    python manage.py test apps.ai_engine.tests_recommendations
"""

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase

from apps.authentication.models import BuyerProfile, Order, OrderItem
from apps.catalog.models import Product, Review, Tag

User = get_user_model()


class ProductRecommendationsTests(APITestCase):
    url = "/api/catalog/recommendations/"

    @classmethod
    def setUpTestData(cls):
        cls.seller = User.objects.create_user(
            email="seller-rec@smartsnack.local",
            full_name="Seller Rec",
            role="seller",
            password="Passw0rd!",
        )
        cls.buyer = User.objects.create_user(
            email="buyer-rec@smartsnack.local",
            full_name="Buyer Rec",
            role="buyer",
            password="Passw0rd!",
        )
        BuyerProfile.objects.create(user=cls.buyer, delivery_address="Calle 1")

        cls.other_buyers = []
        for i in range(3):
            u = User.objects.create_user(
                email=f"buyer-rec-{i}@smartsnack.local",
                full_name=f"Buyer {i}",
                role="buyer",
                password="Passw0rd!",
            )
            BuyerProfile.objects.create(user=u, delivery_address="Calle X")
            cls.other_buyers.append(u)

        cls.allergen_tag = Tag.objects.create(name="mani")
        cls.safe_tag = Tag.objects.create(name="vegano")

        cls.products = []
        for i in range(8):
            p = Product.objects.create(
                seller=cls.seller,
                name=f"Snack {i}",
                description=f"Producto de prueba {i}",
                price=Decimal("4.00") + i,
                stock=20,
                status="active",
                avg_rating=Decimal("4.00"),
                review_count=2,
            )
            if i == 7:
                p.tags.add(cls.allergen_tag)
            else:
                p.tags.add(cls.safe_tag)
            cls.products.append(p)

        cls.suspended = Product.objects.create(
            seller=cls.seller,
            name="Suspendido",
            price=Decimal("1.00"),
            stock=0,
            status="suspended",
        )

        # Co-ocurrencias: varios usuarios compran Snack 0 junto con 1..5
        # para que Item-CF genere vecinos claros de products[0].
        def paid_order(buyer, product_indexes):
            order = Order.objects.create(
                buyer=buyer,
                status="paid",
                delivery_address="Calle 1",
                subtotal=Decimal("10.00"),
                tax=Decimal("1.90"),
                total=Decimal("11.90"),
            )
            for idx in product_indexes:
                product = cls.products[idx]
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    seller=cls.seller,
                    quantity=1,
                    unit_price=product.price,
                    subtotal=product.price,
                )
            return order

        for buyer in cls.other_buyers:
            paid_order(buyer, [0, 1, 2, 3, 4, 5])

        # El comprador objetivo solo compró Snack 0 → debería recibir vecinos.
        paid_order(cls.buyer, [0])

    def setUp(self):
        cache.clear()

    def test_requires_authentication(self):
        response = self.client.get(self.url)
        # DRF puede responder 401 o 403 según de IsAuthenticated + isBuyer.
        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

    def test_requires_buyer_role(self):
        self.client.force_authenticate(user=self.seller)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_ineligible_buyer_without_history(self):
        newbie = User.objects.create_user(
            email="newbie-rec@smartsnack.local",
            full_name="Newbie",
            role="buyer",
            password="Passw0rd!",
        )
        BuyerProfile.objects.create(user=newbie)
        self.client.force_authenticate(user=newbie)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["eligible"])
        self.assertEqual(response.data["results"], [])
        self.assertIsNotNone(response.data["reason"])

    def test_returns_at_least_five_ordered_recommendations(self):
        self.client.force_authenticate(user=self.buyer)
        response = self.client.get(self.url, {"limit": 5})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["eligible"])
        self.assertGreaterEqual(response.data["count"], 5)
        results = response.data["results"]
        self.assertGreaterEqual(len(results), 5)

        # No debe incluir el producto ya comprado ni el suspendido.
        ids = {item["id"] for item in results}
        self.assertNotIn(str(self.products[0].id), ids)
        self.assertNotIn(str(self.suspended.id), ids)

        scores = [item["affinity_score"] for item in results]
        self.assertEqual(scores, sorted(scores, reverse=True))
        self.assertIn("affinity_score", results[0])
        self.assertIn("source", results[0])
        self.assertIn("tags", results[0])
        self.assertIn("reason", results[0])
        self.assertIn("reason_code", results[0])
        self.assertTrue(results[0]["reason"])
        self.assertIn(
            results[0]["reason_code"],
            {"because_purchased", "similar_buyers", "popularity"},
        )

    def test_excludes_allergy_violations(self):
        profile = self.buyer.buyer_profile
        profile.allergies = ["mani"]
        profile.save(update_fields=["allergies"])

        self.client.force_authenticate(user=self.buyer)
        response = self.client.get(self.url, {"limit": 5})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data["results"]:
            self.assertNotIn("mani", [t.lower() for t in item["tags"]])

    def test_review_alone_makes_buyer_eligible(self):
        """Una review cuenta aunque la orden asociada no esté en estados de compra CF."""
        reviewer = User.objects.create_user(
            email="reviewer-rec@smartsnack.local",
            full_name="Reviewer",
            role="buyer",
            password="Passw0rd!",
        )
        BuyerProfile.objects.create(user=reviewer, delivery_address="Calle 2")
        order = Order.objects.create(
            buyer=reviewer,
            status="cancelled",
            delivery_address="Calle 2",
            subtotal=Decimal("5.00"),
            tax=Decimal("0.95"),
            total=Decimal("5.95"),
        )
        OrderItem.objects.create(
            order=order,
            product=self.products[1],
            seller=self.seller,
            quantity=1,
            unit_price=self.products[1].price,
            subtotal=self.products[1].price,
        )
        Review.objects.create(
            buyer=reviewer,
            product=self.products[1],
            order=order,
            rating=5,
        )

        self.client.force_authenticate(user=reviewer)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["eligible"])
        self.assertGreaterEqual(response.data["count"], 5)
