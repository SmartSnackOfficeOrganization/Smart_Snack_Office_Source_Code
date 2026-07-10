"""
Tests de la app `catalog`.
 
Cobertura:
  - Modelos: Product, NutritionFact, ProductImage, Tag/Category.
  - Serializers: validaciones de negocio (price > 0, stock >= 0),
    creación anidada de nutrition_facts y tags.
  - Permisos: IsSeller, IsProductOwner (unitarios con RequestFactory).
  - HU-012 "Gestión de catálogo y fichas nutricionales":
      * Un vendedor autenticado puede crear un producto con su tabla
        nutricional en una sola petición.
      * El sistema valida los datos antes de persistir (precio negativo,
        stock negativo, valores nutricionales no numéricos) y rechaza
        el producto completo si algo falla.
      * Solo vendedores pueden crear/editar/eliminar, y solo el dueño
        del producto puede editarlo o eliminarlo.
  - HU-030 "Visualización del detalle de producto":
      * El detalle de un producto expone todos los datos requeridos
        (descripción, ingredientes, tabla nutricional, etiquetas,
        precio, stock, categoría, imágenes).
      * El detalle es accesible sin autenticación (navegación pública
        del catálogo) y refleja si el producto está agotado (stock=0).
 
NOTA / GAP detectado durante el análisis:
  RF-17 exige rechazar productos "sin imagen", pero en la implementación
  actual `ProductSerializer` no exige imágenes al crear el producto
  (las imágenes se gestionan aparte, vía `ProductImageViewSet`). Se deja
  un test marcado como `expectedFailure` documentando ese vacío en vez
  de omitirlo silenciosamente, para que quede visible en el reporte de
  CI hasta que se implemente la regla.
 
  De igual forma, HU-030 pide mostrar "calificación promedio, número
  total de reseñas y las últimas 10 reseñas": los campos avg_rating y
  review_count sí existen en el modelo Product, pero no hay un modelo
  de Review/reseña en catalog, por lo que ese criterio no se puede
  probar aún a nivel de este módulo.
"""

import unittest
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import RequestFactory, TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
 
from .models import Category, NutritionFact, Product, ProductImage, ProductTag, Tag
from .permissions import IsProductOwner, IsSeller
from .serializers import ProductSerializer
 
User = get_user_model()
 
 
def make_user(email, role, full_name="Usuario de prueba", password="Sup3rSecret1"):
    """Helper para crear usuarios de prueba.
 
    `is_active` se fuerza a True porque el modelo lo
    define con default=False (el flujo real lo activa en el registro,
    RF-01/RF-16).
    """
    return User.objects.create_user(
        email=email,
        full_name=full_name,
        role=role,
        password=password,
        is_active=True,
    )
 
 
# ---------------------------------------------------------------------------
# Modelos
# ---------------------------------------------------------------------------
class ProductModelTests(TestCase):
    def setUp(self):
        self.seller = make_user("seller@corp.com", role="seller")
        self.category = Category.objects.create(name="Snacks salados")
 
    def test_product_str_returns_name(self):
        product = Product.objects.create(
            seller=self.seller,
            category=self.category,
            name="Papas artesanales",
            price=Decimal("5000.00"),
            stock=10,
        )
        self.assertEqual(str(product), "Papas artesanales")
 
    def test_product_defaults(self):
        product = Product.objects.create(
            seller=self.seller,
            category=self.category,
            name="Mix de frutos secos",
            price=Decimal("8000.00"),
            stock=5,
        )
        self.assertEqual(product.status, "active")
        self.assertFalse(product.is_featured)
        self.assertEqual(product.review_count, 0)
 
 
class NutritionFactModelTests(TestCase):
    def setUp(self):
        self.seller = make_user("seller2@corp.com", role="seller")
        self.category = Category.objects.create(name="Barras")
        self.product = Product.objects.create(
            seller=self.seller,
            category=self.category,
            name="Barra de proteína",
            price=Decimal("3500.00"),
            stock=20,
        )
 
    def test_nutrition_fact_one_to_one_with_product(self):
        nutrition = NutritionFact.objects.create(
            product=self.product,
            calories=Decimal("180.00"),
            protein_g=Decimal("12.00"),
            fat_g=Decimal("5.00"),
            carbs_g=Decimal("20.00"),
            sugar_g=Decimal("3.00"),
            sodium_mg=Decimal("120.00"),
            serving_size="40g",
        )
        self.assertEqual(self.product.nutrition_facts, nutrition)
 
 
class ProductImageModelTests(TestCase):
    def setUp(self):
        self.seller = make_user("seller3@corp.com", role="seller")
        self.product = Product.objects.create(
            seller=self.seller,
            name="Galletas integrales",
            price=Decimal("2500.00"),
            stock=15,
        )
 
    def test_image_defaults(self):
        image = ProductImage.objects.create(
            product=self.product, url="https://cdn.example.com/img.png"
        )
        self.assertFalse(image.is_primary)
        self.assertEqual(image.sort_order, 0)
 
 
# ---------------------------------------------------------------------------
# Serializer
# ---------------------------------------------------------------------------
class ProductSerializerValidationTests(TestCase):
    def setUp(self):
        self.seller = make_user("seller4@corp.com", role="seller")
        self.category = Category.objects.create(name="Bebidas")
        self.tag = Tag.objects.create(name="sin-azucar")
 
    def _base_payload(self, **overrides):
        payload = {
            "name": "Té verde en lata",
            "description": "Té verde frío, sin azúcar añadida",
            "ingredients": "Agua, té verde, ácido cítrico",
            "price": "3200.00",
            "stock": 30,
            "category_id": str(self.category.id),
            "tags": [self.tag.name],
        }
        payload.update(overrides)
        return payload
 
    def _fake_request(self):
        factory = RequestFactory()
        request = factory.post("/api/catalog/products/")
        request.user = self.seller
        return request
 
    def test_validate_price_rejects_zero_or_negative(self):
        serializer = ProductSerializer(data=self._base_payload(price="0"))
        self.assertFalse(serializer.is_valid())
        self.assertIn("price", serializer.errors)
 
    def test_validate_stock_rejects_negative(self):
        serializer = ProductSerializer(data=self._base_payload(stock=-1))
        self.assertFalse(serializer.is_valid())
        self.assertIn("stock", serializer.errors)
 
    def test_create_persists_nutrition_facts_and_tags(self):
        payload = self._base_payload(
            nutrition_facts={
                "calories": "5.00",
                "protein_g": "0.20",
                "fat_g": "0.00",
                "carbs_g": "1.00",
                "sugar_g": "0.00",
                "sodium_mg": "10.00",
                "serving_size": "330ml",
            }
        )
        serializer = ProductSerializer(
            data=payload, context={"request": self._fake_request()}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        product = serializer.save()
 
        self.assertEqual(product.seller, self.seller)
        self.assertTrue(hasattr(product, "nutrition_facts"))
        self.assertEqual(product.nutrition_facts.calories, Decimal("5.00"))
        self.assertEqual(
            list(product.tags.values_list("name", flat=True)), [self.tag.name]
        )
 
    def test_create_without_authenticated_user_raises(self):
        serializer = ProductSerializer(
            data=self._base_payload(), context={"request": None}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        with self.assertRaises(Exception):
            serializer.save()
 
 
# ---------------------------------------------------------------------------
# Permisos (unitarios)
# ---------------------------------------------------------------------------
class IsSellerPermissionTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.permission = IsSeller()
        self.seller = make_user("seller5@corp.com", role="seller")
        self.buyer = make_user("buyer1@corp.com", role="buyer")
 
    def test_seller_has_permission(self):
        request = self.factory.post("/")
        request.user = self.seller
        self.assertTrue(self.permission.has_permission(request, view=None))
 
    def test_buyer_has_no_permission(self):
        request = self.factory.post("/")
        request.user = self.buyer
        self.assertFalse(self.permission.has_permission(request, view=None))
 
    def test_anonymous_has_no_permission(self):
        request = self.factory.post("/")
        request.user = None
        self.assertFalse(self.permission.has_permission(request, view=None))
 
 
class IsProductOwnerPermissionTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.permission = IsProductOwner()
        self.owner = make_user("owner@corp.com", role="seller")
        self.other_seller = make_user("otherseller@corp.com", role="seller")
        self.product = Product.objects.create(
            seller=self.owner, name="Snack propio", price=Decimal("1000.00"), stock=1
        )
 
    def test_owner_has_object_permission(self):
        request = self.factory.put("/")
        request.user = self.owner
        self.assertTrue(
            self.permission.has_object_permission(request, view=None, obj=self.product)
        )
 
    def test_non_owner_has_no_object_permission(self):
        request = self.factory.put("/")
        request.user = self.other_seller
        self.assertFalse(
            self.permission.has_object_permission(request, view=None, obj=self.product)
        )
 
 
# ---------------------------------------------------------------------------
# HU-012: Gestión de catálogo y fichas nutricionales
# ---------------------------------------------------------------------------
class HU012CatalogManagementAPITests(APITestCase):
    """
    Criterios de aceptación cubiertos:
      - El vendedor puede crear un producto con su tabla nutricional
        en una sola petición ("gestión de catálogo y fichas
        nutricionales").
      - El sistema valida los datos antes de persistir (rechaza precios
        negativos, stock negativo y valores nutricionales no numéricos).
      - Solo un vendedor autenticado puede crear productos.
      - Solo el vendedor dueño del producto puede editarlo/eliminarlo.
    """
 
    def setUp(self):
        self.seller = make_user("seller_hu12@corp.com", role="seller")
        self.other_seller = make_user("other_hu12@corp.com", role="seller")
        self.buyer = make_user("buyer_hu12@corp.com", role="buyer")
        self.category = Category.objects.create(name="Cereales")
        self.tag = Tag.objects.create(name="alto-en-fibra")
        self.list_url = reverse("catalog-list")
 
    def _valid_payload(self, **overrides):
        payload = {
            "name": "Barra de avena",
            "description": "Barra artesanal de avena y miel",
            "ingredients": "Avena, miel, semillas de girasol",
            "price": "4500.00",
            "stock": 40,
            "category_id": str(self.category.id),
            "tags": [self.tag.name],
            "nutrition_facts": {
                "calories": "210.00",
                "protein_g": "6.00",
                "fat_g": "7.00",
                "carbs_g": "30.00",
                "sugar_g": "10.00",
                "sodium_mg": "40.00",
                "serving_size": "35g",
            },
        }
        payload.update(overrides)
        return payload
 
    def test_seller_creates_product_with_nutrition_table(self):
        self.client.force_authenticate(user=self.seller)
        response = self.client.post(self.list_url, self._valid_payload(), format="json")
 
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(Product.objects.count(), 1)
 
        product = Product.objects.get()
        self.assertEqual(product.seller, self.seller)
        self.assertTrue(hasattr(product, "nutrition_facts"))
        self.assertEqual(product.nutrition_facts.calories, Decimal("210.00"))
        self.assertEqual(response.data["nutrition_facts"]["calories"], "210.00")
 
    def test_rejects_negative_price(self):
        self.client.force_authenticate(user=self.seller)
        response = self.client.post(
            self.list_url, self._valid_payload(price="-100.00"), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("price", response.data)
        self.assertEqual(Product.objects.count(), 0)
 
    def test_rejects_negative_stock(self):
        self.client.force_authenticate(user=self.seller)
        response = self.client.post(
            self.list_url, self._valid_payload(stock=-5), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("stock", response.data)
        self.assertEqual(Product.objects.count(), 0)
 
    def test_rejects_non_numeric_nutrition_value(self):
        self.client.force_authenticate(user=self.seller)
        payload = self._valid_payload(
            nutrition_facts={
                "calories": "no-es-un-numero",
                "protein_g": "6.00",
                "fat_g": "7.00",
                "carbs_g": "30.00",
                "sugar_g": "10.00",
                "sodium_mg": "40.00",
                "serving_size": "35g",
            }
        )
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("nutrition_facts", response.data)
        # No debe quedar ningún producto "huérfano" sin ficha nutricional
        self.assertEqual(Product.objects.count(), 0)
 
    def test_buyer_cannot_create_product(self):
        self.client.force_authenticate(user=self.buyer)
        response = self.client.post(self.list_url, self._valid_payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Product.objects.count(), 0)
 
    def test_anonymous_cannot_create_product(self):
        response = self.client.post(self.list_url, self._valid_payload(), format="json")
        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )
        self.assertEqual(Product.objects.count(), 0)
 
    def test_only_owner_can_update_product(self):
        self.client.force_authenticate(user=self.seller)
        create_response = self.client.post(
            self.list_url, self._valid_payload(), format="json"
        )
        product_id = create_response.data["id"]
        detail_url = reverse("catalog-detail", args=[product_id])
 
        # El vendedor dueño sí puede editar
        response_owner = self.client.patch(
            detail_url, {"stock": 100}, format="json"
        )
        self.assertEqual(response_owner.status_code, status.HTTP_200_OK)
 
        # Otro vendedor no puede editar el producto ajeno
        self.client.force_authenticate(user=self.other_seller)
        response_other = self.client.patch(
            detail_url, {"stock": 999}, format="json"
        )
        self.assertEqual(response_other.status_code, status.HTTP_403_FORBIDDEN)
 
    def test_only_owner_can_delete_product(self):
        self.client.force_authenticate(user=self.seller)
        create_response = self.client.post(
            self.list_url, self._valid_payload(), format="json"
        )
        product_id = create_response.data["id"]
        detail_url = reverse("catalog-detail", args=[product_id])
 
        self.client.force_authenticate(user=self.other_seller)
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Product.objects.filter(id=product_id).exists())
 
    def test_update_replaces_nutrition_facts(self):
        self.client.force_authenticate(user=self.seller)
        create_response = self.client.post(
            self.list_url, self._valid_payload(), format="json"
        )
        product_id = create_response.data["id"]
        detail_url = reverse("catalog-detail", args=[product_id])
 
        response = self.client.patch(
            detail_url,
            {"nutrition_facts": {"calories": "999.00"}},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        product = Product.objects.get(id=product_id)
        self.assertEqual(product.nutrition_facts.calories, Decimal("999.00"))
 
 
class HU012KnownGapTests(APITestCase):
    """Gaps detectados entre los RF/HU y la implementación actual.
 
    Estos tests documentan reglas de negocio pedidas en el análisis que
    todavía NO están implementadas en el código de `catalog`. Se dejan
    como `expectedFailure` para que el pipeline de CI las reporte de
    forma visible en vez de que pasen "por accidente" o se olviden.
    """
 
    def setUp(self):
        self.seller = make_user("seller_gap@corp.com", role="seller")
        self.category = Category.objects.create(name="Snacks dulces")
        self.tag = Tag.objects.create(name="vegano")
        self.list_url = reverse("catalog-list")
 
    @unittest.expectedFailure
    def test_rf17_rejects_product_without_image(self):
        """RF-17 exige rechazar productos sin al menos una imagen.
 
        `ProductSerializer` actualmente no valida esto: las imágenes se
        gestionan en un endpoint aparte (`ProductImageViewSet`) y no son
        obligatorias al crear el producto.
        """
        self.client.force_authenticate(user=self.seller)
        payload = {
            "name": "Chocolate 70%",
            "price": "6000.00",
            "stock": 10,
            "category_id": str(self.category.id),
            "tags": [self.tag.name],
        }
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
 
 
# ---------------------------------------------------------------------------
# HU-030: Visualización del detalle de producto
# ---------------------------------------------------------------------------
class HU030ProductDetailAPITests(APITestCase):
    """
    Criterios de aceptación cubiertos:
      - Al seleccionar un producto se muestra una vista completa con
        nombre, descripción, ingredientes, tabla nutricional, etiquetas,
        precio, stock, categoría e imágenes.
      - La vista indica disponibilidad (stock > 0) o producto agotado
        (stock = 0).
      - La navegación al detalle no requiere autenticación (permission
        list vacía en `retrieve`).
 
    Fuera de alcance de este módulo (ver docstring del archivo):
      - avg_rating / review_count / últimas 10 reseñas dependen de un
        modelo de Review que no existe en `catalog`.
    """
 
    def setUp(self):
        self.seller = make_user("seller_hu30@corp.com", role="seller")
        self.buyer = make_user("buyer_hu30@corp.com", role="buyer")
        self.category = Category.objects.create(name="Snacks salados")
        self.tag = Tag.objects.create(name="picante")
        self.product = Product.objects.create(
            seller=self.seller,
            category=self.category,
            name="Chicharrones picantes",
            description="Chicharrones de cerdo con especias",
            ingredients="Cerdo, sal, chile, especias",
            price=Decimal("4200.00"),
            stock=25,
        )
        ProductTag.objects.create(product=self.product, tag=self.tag)
        NutritionFact.objects.create(
            product=self.product,
            calories=Decimal("530.00"),
            protein_g=Decimal("28.00"),
            fat_g=Decimal("45.00"),
            carbs_g=Decimal("2.00"),
            sugar_g=Decimal("0.00"),
            sodium_mg=Decimal("890.00"),
            serving_size="30g",
        )
        ProductImage.objects.create(
            product=self.product,
            url="https://cdn.example.com/chicharrones.png",
            is_primary=True,
        )
        self.detail_url = reverse("catalog-detail", args=[self.product.id])
 
    def test_detail_accessible_without_authentication(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
 
    def test_authenticated_buyer_can_view_detail(self):
        self.client.force_authenticate(user=self.buyer)
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Chicharrones picantes")
 
    def test_detail_includes_all_required_fields(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
 
        for field in (
            "name",
            "description",
            "ingredients",
            "price",
            "stock",
            "category",
            "tags",
            "images",
            "nutrition_facts",
            "avg_rating",
            "review_count",
        ):
            self.assertIn(field, data, f"Falta el campo '{field}' en el detalle")
 
        self.assertEqual(data["name"], "Chicharrones picantes")
        self.assertEqual(data["nutrition_facts"]["calories"], "530.00")
        self.assertEqual(data["category"]["name"], "Snacks salados")
        self.assertEqual(list(data["tags"]), ["picante"])
        self.assertEqual(len(data["images"]), 1)
        self.assertTrue(data["images"][0]["is_primary"])
 
    def test_detail_reflects_stock_availability(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.data["stock"], 25)  # disponible
 
        self.product.stock = 0
        self.product.save()
 
        response = self.client.get(self.detail_url)
        self.assertEqual(response.data["stock"], 0)  # agotado
 
    def test_detail_404_for_unknown_product(self):
        fake_url = reverse(
            "catalog-detail", args=["00000000-0000-0000-0000-000000000000"]
        )
        response = self.client.get(fake_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
 
# Create your tests here.
