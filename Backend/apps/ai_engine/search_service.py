"""
Servicio de búsqueda de productos para la HU-05 (Búsqueda inteligente).

Implementa la lógica de dos etapas del RF-04:
  1. Coincidencia literal sobre ``name`` y ``description`` de los productos
     activos.
  2. Si la etapa 1 no arroja resultados, ranking por relevancia semántica
     (TF-IDF) sobre todo el catálogo activo, delegando el cálculo al motor de
     scikit-learn ubicado en ``ml/search/tfidf_engine.py``.

Cada producto devuelto se anota (en memoria, sin tocar la BD) con:
  - ``relevance_score``: score TF-IDF (None en la etapa literal).
  - ``match_stage``: "literal" o "tfidf".
  - ``is_compatible``: compatibilidad con ``BuyerProfile.allergies`` (None si
    no hay usuario/perfil).

Vive en la app ``ai_engine`` (features de IA del backend). El modelo ``Product``
pertenece a la app ``catalog``.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import List, Optional

from django.db.models import Q

from apps.catalog.allergies import product_is_compatible
from apps.catalog.models import Product

# --- Shim de importación de `ml/` -------------------------------------------
# La carpeta `ml/` es hermana de `Backend/` (raíz del repo), por lo que no está
# en el sys.path al ejecutar Django desde `Backend/`. Insertamos la raíz del
# repositorio para poder importar el motor TF-IDF cuando se corre en local. En
# Docker `ml/` se monta dentro del contenedor (ver README de la app).
_REPO_ROOT = Path(__file__).resolve().parents[3]  # ai_engine -> apps -> Backend -> raíz
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from ml.search.tfidf_engine import rank_documents  # noqa: E402

# Etiquetas de la etapa que produjo cada resultado.
STAGE_LITERAL = "literal"
STAGE_TFIDF = "tfidf"


def _active_products():
    """Productos visibles para el comprador (regla de negocio: no suspendidos)."""
    return (
        Product.objects.filter(status="active")
        .select_related("category")
        .prefetch_related("tags")
    )


def _build_document(product: Product) -> str:
    """Texto que representa a un producto en el corpus TF-IDF."""
    parts = [
        product.name or "",
        product.description or "",
        product.ingredients or "",
    ]
    if product.category_id and product.category:
        parts.append(product.category.name or "")
    parts.extend(tag.name for tag in product.tags.all())
    return " ".join(parts)


def _evaluate_compatibility(product: Product, user) -> Optional[bool]:
    """
    Compatibilidad con ``BuyerProfile.allergies`` (tags del producto).

    - ``None`` si no hay usuario autenticado o no tiene perfil de comprador.
    - ``True``/``False`` según coincidencia alergias ↔ tags (misma regla del carrito).
    """
    if user is None:
        return None
    profile = getattr(user, "buyer_profile", None)
    if profile is None:
        return None
    allergies = profile.allergies or []
    if not allergies:
        return True
    tag_names = [tag.name for tag in product.tags.all()]
    return product_is_compatible(allergies, tag_names)


def _annotate(product: Product, score: Optional[float], stage: str, user) -> Product:
    """Adjunta metadatos de búsqueda a la instancia (solo en memoria)."""
    product.relevance_score = score
    product.match_stage = stage
    product.is_compatible = _evaluate_compatibility(product, user)
    return product


def search_products(query: str, user=None) -> List[Product]:
    """
    Ejecuta la búsqueda de dos etapas y devuelve una lista ordenada de productos.

    Args:
        query: término de búsqueda ingresado por el comprador.
        user: usuario autenticado (o None). Reservado para el marcado por
            restricciones alimentarias.

    Returns:
        Lista de instancias ``Product`` anotadas y ordenadas por relevancia. La
        lista se pagina en la vista (20 por página, RF-04).
    """
    query = (query or "").strip()
    if not query:
        return []

    # --- Etapa 1: coincidencia literal (nombre / descripción) ---------------
    literal = list(
        _active_products()
        .filter(Q(name__icontains=query) | Q(description__icontains=query))
        .order_by("-is_featured", "-avg_rating", "name")
    )
    if literal:
        return [_annotate(p, None, STAGE_LITERAL, user) for p in literal]

    # --- Etapa 2: ranking semántico TF-IDF ----------------------------------
    candidates = list(_active_products())
    if not candidates:
        return []

    documents = [_build_document(p) for p in candidates]
    ranked = rank_documents(query, documents)

    return [
        _annotate(candidates[index], score, STAGE_TFIDF, user)
        for index, score in ranked
    ]
