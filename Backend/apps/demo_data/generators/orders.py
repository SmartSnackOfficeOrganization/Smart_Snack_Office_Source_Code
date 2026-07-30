from __future__ import annotations

import math
import random
from datetime import timedelta

from apps.authentication.models import User
from apps.cart.models import CartItem
from apps.cart.services import (add_product_to_cart, create_order_from_cart,
                                get_or_create_cart)
from apps.demo_data.config import DemoDataConfig
from apps.demo_data.generators.payments import PaymentGenerator
from apps.demo_data.personas import get_persona
from django.utils import timezone
from rest_framework.exceptions import ValidationError


class OrderGenerator:
    def __init__(self, config: DemoDataConfig, rng: random.Random):
        self.config = config
        self.rng = rng
        self.payments = PaymentGenerator(config, rng)

    def create_orders(
        self,
        buyers: list[tuple[User, list[str]]],
        products: list,
    ) -> list:
        if not buyers or not products:
            return []

        # Preload tag/category for affinity scoring
        product_meta = []
        for product in products:
            tag_names = set(product.tags.values_list("name", flat=True))
            category_name = product.category.name if product.category_id else ""
            popularity = getattr(product, "_demo_popularity", 1.0 / len(products))
            product_meta.append(
                {
                    "product": product,
                    "tags": tag_names,
                    "category": category_name,
                    "popularity": popularity,
                }
            )

        order_counts = self._zipf_order_counts(len(buyers), self.config.orders)
        created_orders = []

        for (buyer, persona_keys), n_orders in zip(buyers, order_counts):
            allergies = set(
                (getattr(buyer, "buyer_profile", None).allergies or [])
                if hasattr(buyer, "buyer_profile")
                else []
            )
            # Refresh profile allergies from DB if needed
            profile = getattr(buyer, "buyer_profile", None)
            if profile is not None:
                allergies = {a.lower() for a in (profile.allergies or [])}

            for _ in range(n_orders):
                order = self._create_one_order(
                    buyer=buyer,
                    persona_keys=persona_keys,
                    product_meta=product_meta,
                    allergies=allergies,
                )
                if order is not None:
                    created_orders.append(order)

        return created_orders

    def _create_one_order(
        self,
        *,
        buyer: User,
        persona_keys: list[str],
        product_meta: list[dict],
        allergies: set[str],
    ):
        cart = get_or_create_cart(buyer)
        CartItem.objects.filter(cart=cart).delete()

        cart_size = self._sample_cart_size()
        chosen = self._sample_products(product_meta, persona_keys, allergies, cart_size)
        if not chosen:
            return None

        try:
            for product in chosen:
                qty = self.rng.randint(1, 3)
                # Refresh stock from DB to avoid stale in-memory values after mark_as_paid
                product.refresh_from_db(fields=["stock", "price"])
                if product.stock < 1:
                    continue
                qty = min(qty, product.stock)
                add_product_to_cart(cart=cart, product=product, quantity=qty)
        except ValidationError:
            CartItem.objects.filter(cart=cart).delete()
            return None

        if not CartItem.objects.filter(cart=cart).exists():
            return None

        try:
            order = create_order_from_cart(buyer)
        except ValidationError:
            CartItem.objects.filter(cart=cart).delete()
            return None

        # Backdate slightly for realism
        days_ago = self.rng.randint(0, 90)
        Order = order.__class__
        Order.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timedelta(days=days_ago)
        )
        order.refresh_from_db()

        self.payments.settle_order(order)
        return order

    def _sample_cart_size(self) -> int:
        size = int(round(self.rng.gauss(self.config.avg_cart_size, 1.0)))
        return max(1, min(self.config.max_cart_size, size))

    def _sample_products(
        self,
        product_meta: list[dict],
        persona_keys: list[str],
        allergies: set[str],
        k: int,
    ) -> list:
        weights = []
        eligible = []
        for meta in product_meta:
            tags_lower = {t.lower() for t in meta["tags"]}
            if allergies and tags_lower.intersection(allergies):
                continue
            score = meta["popularity"] * self._affinity_score(meta, persona_keys)
            if score <= 0:
                continue
            eligible.append(meta["product"])
            weights.append(score)

        if not eligible:
            return []

        k = min(k, len(eligible))
        # Weighted sampling without replacement
        chosen = []
        pool = list(zip(eligible, weights))
        for _ in range(k):
            total = sum(w for _, w in pool)
            if total <= 0 or not pool:
                break
            pick = self.rng.uniform(0, total)
            running = 0.0
            idx = 0
            for i, (_, w) in enumerate(pool):
                running += w
                if running >= pick:
                    idx = i
                    break
            product, _ = pool.pop(idx)
            chosen.append(product)
        return chosen

    def _affinity_score(self, meta: dict, persona_keys: list[str]) -> float:
        if not persona_keys:
            return 1.0
        score = 0.0
        for key in persona_keys:
            persona = get_persona(key)
            cat_w = persona.category_weights.get(meta["category"], 0.05)
            tag_w = 0.05
            for tag, weight in persona.tag_weights.items():
                if tag in meta["tags"]:
                    tag_w = max(tag_w, weight)
            score += cat_w * 0.6 + tag_w * 0.4
        return score / len(persona_keys)

    def _zipf_order_counts(self, n_buyers: int, total_orders: int) -> list[int]:
        if n_buyers == 0 or total_orders == 0:
            return [0] * n_buyers
        raw = [1.0 / math.pow(i + 1, 0.9) for i in range(n_buyers)]
        total_w = sum(raw)
        floats = [w / total_w * total_orders for w in raw]
        counts = [int(x) for x in floats]
        remainder = total_orders - sum(counts)
        # Distribute remainder to top buyers
        order_idx = sorted(range(n_buyers), key=lambda i: -floats[i])
        for i in range(remainder):
            counts[order_idx[i % n_buyers]] += 1
        self.rng.shuffle(counts)
        return counts
