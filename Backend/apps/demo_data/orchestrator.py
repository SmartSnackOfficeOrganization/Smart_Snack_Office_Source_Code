from __future__ import annotations

import random
from dataclasses import dataclass, field

from apps.demo_data.config import DemoDataConfig
from apps.demo_data.generators.catalog import CatalogGenerator
from apps.demo_data.generators.orders import OrderGenerator
from apps.demo_data.generators.reviews import ReviewGenerator
from apps.demo_data.generators.users import UserGenerator


@dataclass
class DemoDataSummary:
    cleared_users: int = 0
    sellers: int = 0
    buyers: int = 0
    products: int = 0
    orders: int = 0
    reviews: int = 0
    sample_buyer_email: str = ""
    sample_seller_email: str = ""
    password: str = ""
    notes: list[str] = field(default_factory=list)


class DemoDataOrchestrator:
    def __init__(self, config: DemoDataConfig):
        self.config = config
        self.rng = random.Random(config.seed)

    def run(self) -> DemoDataSummary:
        summary = DemoDataSummary(password=self.config.password)
        users = UserGenerator(self.config, self.rng)
        catalog = CatalogGenerator(self.config, self.rng)
        orders = OrderGenerator(self.config, self.rng)
        reviews = ReviewGenerator(self.config, self.rng)

        if self.config.clear:
            summary.cleared_users = users.clear_demo_users()

        sellers = users.create_sellers()
        buyer_pairs = users.create_buyers()
        summary.sellers = len(sellers)
        summary.buyers = len(buyer_pairs)
        if sellers:
            summary.sample_seller_email = sellers[0].email
        if buyer_pairs:
            summary.sample_buyer_email = buyer_pairs[0][0].email

        products = catalog.create_products(sellers)
        summary.products = len(products)

        created_orders = orders.create_orders(buyer_pairs, products)
        summary.orders = len(created_orders)
        if summary.orders < self.config.orders:
            summary.notes.append(
                f"Se solicitaron {self.config.orders} ordenes; se crearon {summary.orders} "
                "(stock/alergias/carrito pueden reducir el total)."
            )

        created_reviews = reviews.create_reviews()
        summary.reviews = len(created_reviews)
        if summary.reviews < self.config.reviews:
            summary.notes.append(
                f"Se solicitaron {self.config.reviews} resenas; se crearon {summary.reviews} "
                "(solo ordenes delivered son elegibles)."
            )

        return summary
