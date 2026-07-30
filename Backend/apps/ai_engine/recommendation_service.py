"""
Servicio de recomendaciones personalizadas (HU-07 / Item-Based CF).

Orquesta:
  1. Elegibilidad del comprador (≥1 compra pagada/enviada/entregada o ≥1 review).
  2. Matriz de interacciones (OrderItem + Review).
  3. Similitud ítem–ítem vía ``ml.recommend.item_cf_engine`` (cache Redis/locmem).
  4. Ranking por afinidad, exclusión de ya comprados/calificados.
  5. Filtro de productos activos + alergias (misma regla que el carrito).
  6. Fallback de popularidad si CF no alcanza ``limit`` tras los filtros.
"""

from __future__ import annotations

import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Set

from apps.authentication.models import OrderItem
from apps.catalog.allergies import matching_allergens
from apps.catalog.models import Product, Review
from django.core.cache import cache

# --- Shim de importación de `ml/` (mismo patrón que search_service) ----------
_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from ml.recommend.item_cf_engine import (
    accumulate_interactions,  # noqa: E402
    best_seed_item,
    compute_item_similarity,
    recommend_for_user,
)

PAID_ORDER_STATUSES = ("paid", "shipped", "delivered")
DEFAULT_LIMIT = 5
MIN_LIMIT = 5
MAX_LIMIT = 24
CACHE_SIM_KEY = "item_cf:item_similarity:v1"
CACHE_SIM_TTL_SECONDS = 300
SOURCE_ITEM_CF = "item_cf"
SOURCE_POPULARITY = "popularity"


@dataclass
class RecommendationResult:
    eligible: bool
    reason: Optional[str] = None
    products: List[Product] = field(default_factory=list)


def _buyer_allergies(user) -> list:
    profile = getattr(user, "buyer_profile", None)
    if not profile:
        return []
    return list(profile.allergies or [])


def user_is_eligible(user) -> bool:
    """Criterio de aceptación: al menos una compra relevante o una calificación."""
    has_purchase = OrderItem.objects.filter(
        order__buyer=user,
        order__status__in=PAID_ORDER_STATUSES,
    ).exists()
    if has_purchase:
        return True
    return Review.objects.filter(buyer=user).exists()


def _load_interaction_rows():
    """Filas (user_id, product_id, weight) desde compras y reviews."""
    rows = []

    purchase_qs = OrderItem.objects.filter(
        order__status__in=PAID_ORDER_STATUSES,
    ).values_list("order__buyer_id", "product_id", "quantity")
    for buyer_id, product_id, quantity in purchase_qs.iterator():
        weight = float(quantity) if quantity and quantity > 0 else 1.0
        rows.append((str(buyer_id), str(product_id), weight))

    review_qs = Review.objects.values_list("buyer_id", "product_id", "rating")
    for buyer_id, product_id, rating in review_qs.iterator():
        rows.append((str(buyer_id), str(product_id), float(rating)))

    return rows


def _get_item_similarity(interactions):
    cached = cache.get(CACHE_SIM_KEY)
    if cached is not None:
        return cached
    similarity = compute_item_similarity(interactions)
    cache.set(CACHE_SIM_KEY, similarity, CACHE_SIM_TTL_SECONDS)
    return similarity


def _user_interacted_product_ids(user) -> Set[str]:
    purchased = OrderItem.objects.filter(
        order__buyer=user,
        order__status__in=PAID_ORDER_STATUSES,
    ).values_list("product_id", flat=True)
    reviewed = Review.objects.filter(buyer=user).values_list("product_id", flat=True)
    return {str(pid) for pid in purchased} | {str(pid) for pid in reviewed}


def _short_product_name(name: str, max_len: int = 36) -> str:
    clean = (name or "").strip()
    if len(clean) <= max_len:
        return clean
    return clean[: max_len - 1].rstrip() + "…"


def _annotate(
    product: Product,
    score: float,
    source: str,
    *,
    reason_code: str,
    reason: str,
) -> Product:
    product.affinity_score = float(score)
    product.recommendation_source = source
    product.recommendation_reason_code = reason_code
    product.recommendation_reason = reason
    return product


def _cf_reason_for(
    candidate_id: str,
    user_weights,
    similarity,
    products_by_id: Dict[str, Product],
) -> tuple[str, str]:
    seed_id = best_seed_item(candidate_id, user_weights, similarity)
    if seed_id:
        seed = products_by_id.get(seed_id)
        if seed is None:
            seed = Product.objects.filter(id=seed_id).only("name").first()
        if seed:
            return (
                "because_purchased",
                f"Porque compraste {_short_product_name(seed.name)}",
            )
    return ("similar_buyers", "Porque compradores como tú lo eligen")


def _passes_allergy_filter(product: Product, allergies: list) -> bool:
    if not allergies:
        return True
    tag_names = [tag.name for tag in product.tags.all()]
    return not matching_allergens(allergies, tag_names)


def _active_products_by_ids(product_ids: List[str]) -> Dict[str, Product]:
    if not product_ids:
        return {}
    qs = (
        Product.objects.filter(status="active", id__in=product_ids)
        .select_related("category")
        .prefetch_related("tags")
    )
    return {str(p.id): p for p in qs}


def _popularity_candidates(exclude_ids: Set[str], allergies: list, needed: int):
    if needed <= 0:
        return []

    qs = (
        Product.objects.filter(status="active")
        .exclude(id__in=exclude_ids)
        .select_related("category")
        .prefetch_related("tags")
        .order_by("-avg_rating", "-review_count", "-is_featured", "name")
    )

    results: List[Product] = []
    # Over-fetch for allergy filtering in memory.
    for product in qs[: max(needed * 5, needed)]:
        if not _passes_allergy_filter(product, allergies):
            continue
        # Score sintético decreciente para orden estable en el serializer.
        score = float(product.avg_rating or 0) + (product.review_count or 0) * 0.01
        results.append(
            _annotate(
                product,
                score,
                SOURCE_POPULARITY,
                reason_code="popularity",
                reason="Popular en tu equipo",
            )
        )
        if len(results) >= needed:
            break
    return results


def get_recommendations(user, limit: int = DEFAULT_LIMIT) -> RecommendationResult:
    """
    Devuelve recomendaciones personalizadas para ``user``.

    Args:
        user: comprador autenticado.
        limit: cantidad objetivo (mínimo de aceptación: 5).
    """
    limit = max(MIN_LIMIT, min(int(limit or DEFAULT_LIMIT), MAX_LIMIT))

    if not user_is_eligible(user):
        return RecommendationResult(
            eligible=False,
            reason=(
                "Se requiere al menos una compra previa o haber calificado "
                "al menos un producto."
            ),
            products=[],
        )

    allergies = _buyer_allergies(user)
    interactions = accumulate_interactions(_load_interaction_rows())
    similarity = _get_item_similarity(interactions)

    user_key = str(user.id)
    user_weights = interactions.get(user_key, {})
    exclude_ids = _user_interacted_product_ids(user)

    # Over-fetch CF candidates to allow allergy / inactive filtering.
    cf_ranked = recommend_for_user(
        user_weights,
        similarity,
        exclude=exclude_ids,
        top_n=max(limit * 4, limit),
    )

    candidate_ids = [item_id for item_id, _ in cf_ranked]
    seed_ids = {
        sid
        for item_id, _ in cf_ranked
        if (sid := best_seed_item(item_id, user_weights, similarity))
    }
    products_by_id = _active_products_by_ids(candidate_ids)
    if seed_ids:
        for seed in Product.objects.filter(id__in=seed_ids).only("id", "name"):
            products_by_id.setdefault(str(seed.id), seed)
    selected: List[Product] = []
    selected_ids: Set[str] = set()

    for item_id, score in cf_ranked:
        product = products_by_id.get(item_id)
        if product is None:
            continue
        if not _passes_allergy_filter(product, allergies):
            continue
        reason_code, reason = _cf_reason_for(
            item_id, user_weights, similarity, products_by_id
        )
        selected.append(
            _annotate(
                product,
                score,
                SOURCE_ITEM_CF,
                reason_code=reason_code,
                reason=reason,
            )
        )
        selected_ids.add(item_id)
        if len(selected) >= limit:
            break

    if len(selected) < limit:
        fallback_exclude = exclude_ids | selected_ids
        selected.extend(
            _popularity_candidates(fallback_exclude, allergies, limit - len(selected))
        )

    return RecommendationResult(eligible=True, products=selected)
