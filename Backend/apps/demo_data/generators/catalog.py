from __future__ import annotations

import math
import random

from apps.authentication.models import User
from apps.catalog.models import Category, Tag
from apps.catalog.services import create_product
from apps.demo_data.config import DemoDataConfig
from apps.demo_data.providers.catalog_data import ALL_TAGS, build_product_spec


class CatalogGenerator:
    def __init__(self, config: DemoDataConfig, rng: random.Random):
        self.config = config
        self.rng = rng

    def ensure_tags(self) -> None:
        for name in ALL_TAGS:
            Tag.objects.get_or_create(name=name)

    def create_products(self, sellers: list[User]) -> list:
        categories = list(Category.objects.all())
        if not categories:
            raise RuntimeError(
                "No hay categorías. Ejecuta migraciones (seed_categories) primero."
            )
        if not sellers:
            raise RuntimeError("Se requieren sellers para crear productos.")

        self.ensure_tags()
        products = []
        for i in range(1, self.config.products + 1):
            category = self.rng.choice(categories)
            seller = self.rng.choice(sellers)
            spec = build_product_spec(self.rng, category.name, i)
            product = create_product(
                seller=seller,
                category=category,
                name=spec["name"],
                description=spec["description"],
                ingredients=spec["ingredients"],
                price=spec["price"],
                stock=spec["stock"],
                status="active",
                is_featured=spec["is_featured"],
                tags=spec["tags"],
                nutrition_facts=spec["nutrition_facts"],
            )
            products.append(product)

        # Assign power-law popularity weights (stored on the list order via attr)
        weights = self._power_law_weights(len(products))
        for product, weight in zip(products, weights):
            product._demo_popularity = weight  # noqa: SLF001 — runtime hint for CF

        return products

    def _power_law_weights(self, n: int) -> list[float]:
        if n == 0:
            return []
        raw = [1.0 / math.pow(i + 1, 1.1) for i in range(n)]
        total = sum(raw)
        return [w / total for w in raw]
