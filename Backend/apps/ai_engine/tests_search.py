"""
Pruebas de la búsqueda inteligente de productos (HU-05 / RF-04).

Dependen del modelo ``Product`` de la app ``catalog`` y de ``scikit-learn``.

    python manage.py test apps.ai_engine
"""

from decimal import Decimal

from apps.catalog.models import Category, Product
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class ProductSearchTests(APITestCase):
    """Cubre las dos etapas (literal y TF-IDF), filtros y paginación."""

    url = "/api/catalog/search/"

    @classmethod
    def setUpTestData(cls):
        cls.seller = User.objects.create_user(
            email="seller@smartsnack.local",
            full_name="Vendedor de Prueba",
            role="seller",
            password="Passw0rd!",
        )
        cls.dulces = Category.objects.create(name="Dulces")

        cls.chocolate = Product.objects.create(
            seller=cls.seller,
            category=cls.dulces,
            name="Chocolate amargo",
            description="Barra de chocolate dulce y suave",
            ingredients="cacao, azucar, leche",
            price=Decimal("5.00"),
            stock=10,
            status="active",
        )
        cls.chips = Product.objects.create(
            seller=cls.seller,
            name="Papas picantes",
            description="Snack crujiente con chile picante",
            ingredients="papa, chile, sal",
            price=Decimal("3.50"),
            stock=20,
            status="active",
        )
        # Producto suspendido: nunca debe aparecer en resultados (regla de negocio).
        cls.oculto = Product.objects.create(
            seller=cls.seller,
            name="Dulce descontinuado",
            description="No deberia verse",
            price=Decimal("1.00"),
            stock=0,
            status="suspended",
        )

    def test_missing_query_returns_400(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_literal_match_on_name_or_description(self):
        response = self.client.get(self.url, {"q": "picante"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item["name"] for item in response.data["results"]]
        self.assertIn("Papas picantes", names)
        self.assertNotIn("Dulce descontinuado", names)  # suspendido
        stages = {item["match_stage"] for item in response.data["results"]}
        self.assertEqual(stages, {"literal"})

    def test_tfidf_fallback_when_no_literal_match(self):
        # "cacao" no aparece en name/description de ningun producto (solo en
        # ingredients), por lo que la etapa literal falla y entra TF-IDF.
        response = self.client.get(self.url, {"q": "cacao"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertTrue(results)
        self.assertEqual(results[0]["name"], "Chocolate amargo")
        self.assertEqual(results[0]["match_stage"], "tfidf")
        self.assertIsNotNone(results[0]["relevance_score"])

    def test_is_compatible_placeholder_is_present(self):
        response = self.client.get(self.url, {"q": "picante"})
        self.assertIn("is_compatible", response.data["results"][0])

    def test_pagination_envelope_is_present(self):
        response = self.client.get(self.url, {"q": "picante"})
        self.assertIn("results", response.data)
        self.assertIn("count", response.data)
