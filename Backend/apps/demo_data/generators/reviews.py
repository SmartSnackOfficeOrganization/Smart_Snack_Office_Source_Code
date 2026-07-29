from __future__ import annotations

import random

from apps.catalog.models import Review
from apps.demo_data.config import DemoDataConfig
from apps.orders.models import Order

REVIEW_COMMENTS = [
    "Excelente para la oficina, lo volveremos a pedir.",
    "Buena relacion calidad-precio.",
    "Sabor agradable, porciones justas.",
    "Llego fresco y bien empacado.",
    "Un poco dulce para mi gusto, pero el equipo lo disfruto.",
    "Ideal para las reuniones de la tarde.",
    "Repetiremos compra sin duda.",
    "Cumple con lo esperado.",
]


class ReviewGenerator:
    def __init__(self, config: DemoDataConfig, rng: random.Random):
        self.config = config
        self.rng = rng

    def create_reviews(self, target_count: int | None = None) -> list[Review]:
        target = target_count if target_count is not None else self.config.reviews
        if target <= 0:
            return []

        delivered = (
            Order.objects.filter(status="delivered")
            .prefetch_related("items__product")
            .select_related("buyer")
        )

        candidates = []
        for order in delivered:
            for item in order.items.all():
                already = Review.objects.filter(
                    buyer=order.buyer, product=item.product, order=order
                ).exists()
                if not already:
                    candidates.append((order, item.product))

        self.rng.shuffle(candidates)
        created: list[Review] = []
        for order, product in candidates[:target]:
            rating = self._biased_rating()
            comment = (
                self.rng.choice(REVIEW_COMMENTS) if self.rng.random() < 0.75 else None
            )
            review = Review.objects.create(
                buyer=order.buyer,
                product=product,
                order=order,
                rating=rating,
                comment=comment,
            )
            created.append(review)
        return created

    def _biased_rating(self) -> int:
        # Realistic skew toward 4-5
        return self.rng.choices([1, 2, 3, 4, 5], weights=[3, 5, 12, 35, 45], k=1)[0]
