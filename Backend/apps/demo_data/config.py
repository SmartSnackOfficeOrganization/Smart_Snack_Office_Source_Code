from dataclasses import dataclass

DEMO_EMAIL_DOMAIN = "demo.smartsnack.local"


@dataclass
class DemoDataConfig:
    buyers: int = 50
    sellers: int = 5
    products: int = 100
    orders: int = 300
    reviews: int = 150
    seed: int = 42
    clear: bool = False
    password: str = "DemoPass123!"

    # Purchase / fulfillment ratios
    paid_ratio: float = 0.85
    delivered_ratio: float = 0.70  # of paid orders
    payment_failed_ratio: float = 0.10  # of unpaid remainder roughly
    avg_cart_size: float = 2.5
    max_cart_size: int = 5

    email_domain: str = DEMO_EMAIL_DOMAIN
