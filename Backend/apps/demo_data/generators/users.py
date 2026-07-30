from __future__ import annotations

import random

from apps.authentication.models import BuyerProfile, SellerProfile, User
from apps.demo_data.config import DemoDataConfig
from apps.demo_data.personas import PERSONAS
from apps.demo_data.providers.catalog_data import (random_address,
                                                   random_business_name,
                                                   random_full_name)
from django.db import transaction


class UserGenerator:
    def __init__(self, config: DemoDataConfig, rng: random.Random):
        self.config = config
        self.rng = rng

    def clear_demo_users(self) -> int:
        deleted, _ = User.objects.filter(
            email__iendswith=f"@{self.config.email_domain}"
        ).delete()
        return deleted

    def create_sellers(self) -> list[User]:
        sellers: list[User] = []
        for i in range(1, self.config.sellers + 1):
            email = f"seller{i:03d}@{self.config.email_domain}"
            with transaction.atomic():
                user = User.objects.create_user(
                    email=email,
                    full_name=random_full_name(self.rng),
                    role="seller",
                    password=self.config.password,
                    is_active=True,
                    terms_accepted=True,
                )
                SellerProfile.objects.create(
                    user=user,
                    business_name=random_business_name(self.rng),
                    tax_info=f"NIT {self.rng.randint(800000000, 999999999)}",
                    commercial_info="Proveedor demo SmartSnack",
                )
            sellers.append(user)
        return sellers

    def create_buyers(self) -> list[tuple[User, list[str]]]:
        """
        Returns list of (buyer, persona_keys).
        """
        buyers: list[tuple[User, list[str]]] = []
        for i in range(1, self.config.buyers + 1):
            email = f"buyer{i:03d}@{self.config.email_domain}"
            persona_keys = self._sample_personas()
            allergies = self._sample_allergies(persona_keys)
            with transaction.atomic():
                user = User.objects.create_user(
                    email=email,
                    full_name=random_full_name(self.rng),
                    role="buyer",
                    password=self.config.password,
                    is_active=True,
                    terms_accepted=True,
                )
                BuyerProfile.objects.create(
                    user=user,
                    delivery_address=random_address(self.rng),
                    company_name=f"Empresa Demo {i:03d}",
                    allergies=allergies,
                )
            buyers.append((user, persona_keys))
        return buyers

    def _sample_personas(self) -> list[str]:
        count = 1 if self.rng.random() < 0.7 else 2
        chosen = self.rng.sample(list(PERSONAS), k=min(count, len(PERSONAS)))
        return [p.key for p in chosen]

    def _sample_allergies(self, persona_keys: list[str]) -> list[str]:
        pool: list[str] = []
        for key in persona_keys:
            for persona in PERSONAS:
                if persona.key == key:
                    pool.extend(persona.allergy_pool)
        if not pool or self.rng.random() > 0.35:
            return []
        unique = list(dict.fromkeys(pool))
        k = self.rng.randint(1, min(2, len(unique)))
        return self.rng.sample(unique, k=k)
