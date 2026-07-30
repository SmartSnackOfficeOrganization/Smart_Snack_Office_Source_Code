"""
Motor Item-Based Collaborative Filtering (Django-free).

Construye similitud coseno ítem–ítem a partir de una matriz usuario–ítem
dispersa y puntúa candidatos para un usuario según la afinidad con los ítems
que ya interactuó (compras / calificaciones).

Vive en ``ml/`` según la arquitectura del proyecto; la orquestación con la BD
está en ``apps.ai_engine.recommendation_service``.
"""

from __future__ import annotations

from typing import (Dict, List, Mapping, MutableMapping, Optional, Sequence,
                    Set, Tuple)

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# user_id -> item_id -> peso (cantidad de compra y/o rating)
UserItemMatrix = Mapping[str, Mapping[str, float]]
ItemSimilarity = Dict[str, Dict[str, float]]


def compute_item_similarity(
    interactions: UserItemMatrix,
    *,
    min_similarity: float = 0.0,
) -> ItemSimilarity:
    """
    Calcula similitud coseno entre ítems a partir de co-ocurrencia de usuarios.

    Args:
        interactions: mapa usuario → {ítem: peso}.
        min_similarity: umbral mínimo para guardar un par (por defecto 0).

    Returns:
        Diccionario ``item_id → {otro_item_id: similitud}`` (simétrico, sin
        diagonal). Vacío si hay menos de 2 ítems o ningún usuario.
    """
    if not interactions:
        return {}

    item_ids: List[str] = sorted(
        {item_id for user_items in interactions.values() for item_id in user_items}
    )
    user_ids: List[str] = sorted(interactions.keys())
    if len(item_ids) < 2 or not user_ids:
        return {}

    item_index = {item_id: idx for idx, item_id in enumerate(item_ids)}
    matrix = np.zeros((len(user_ids), len(item_ids)), dtype=np.float64)

    for u_idx, user_id in enumerate(user_ids):
        for item_id, weight in interactions[user_id].items():
            matrix[u_idx, item_index[item_id]] = float(weight)

    # Similitud entre columnas (ítems).
    similarity_matrix = cosine_similarity(matrix.T)

    result: ItemSimilarity = {item_id: {} for item_id in item_ids}
    n_items = len(item_ids)
    for i in range(n_items):
        for j in range(i + 1, n_items):
            score = float(similarity_matrix[i, j])
            if score <= min_similarity:
                continue
            a, b = item_ids[i], item_ids[j]
            result[a][b] = score
            result[b][a] = score
    return result


def recommend_for_user(
    user_weights: Mapping[str, float],
    item_similarity: Mapping[str, Mapping[str, float]],
    *,
    exclude: Optional[Set[str]] = None,
    top_n: int = 5,
) -> List[Tuple[str, float]]:
    """
    Puntúa ítems candidatos por afinidad Item-Based CF.

    Para cada ítem ``i`` ya interactuado por el usuario con peso ``w_i``, suma
    ``sim(i, j) * w_i`` a cada vecino ``j`` no excluido.

    Returns:
        Lista ``(item_id, affinity_score)`` ordenada por score descendente,
        recortada a ``top_n``.
    """
    if not user_weights or top_n <= 0:
        return []

    excluded: Set[str] = set(exclude or ())
    excluded.update(user_weights.keys())

    scores: MutableMapping[str, float] = {}
    for liked_item, weight in user_weights.items():
        neighbors = item_similarity.get(liked_item) or {}
        for other_item, similarity in neighbors.items():
            if other_item in excluded or similarity <= 0:
                continue
            scores[other_item] = scores.get(other_item, 0.0) + similarity * float(
                weight
            )

    ranked = sorted(scores.items(), key=lambda pair: pair[1], reverse=True)
    return ranked[:top_n]


def best_seed_item(
    candidate_id: str,
    user_weights: Mapping[str, float],
    item_similarity: Mapping[str, Mapping[str, float]],
) -> Optional[str]:
    """
    Ítem del historial del usuario que más contribuye a recomendar ``candidate_id``.

    Útil para textos tipo \"Porque compraste X\".
    """
    best_id: Optional[str] = None
    best_score = 0.0
    for liked_item, weight in user_weights.items():
        similarity = (item_similarity.get(liked_item) or {}).get(candidate_id, 0.0)
        if similarity <= 0:
            continue
        score = float(similarity) * float(weight)
        if score > best_score:
            best_score = score
            best_id = liked_item
    return best_id


def merge_interaction_weight(
    current: Optional[float],
    new_weight: float,
) -> float:
    """Combina dos señales sobre el mismo (usuario, ítem) tomando el máximo."""
    if current is None:
        return float(new_weight)
    return max(float(current), float(new_weight))


def accumulate_interactions(
    rows: Sequence[Tuple[str, str, float]],
) -> Dict[str, Dict[str, float]]:
    """
    Agrega filas ``(user_id, item_id, weight)`` en una matriz usuario–ítem.

    Si hay varias señales para el mismo par, se conserva el peso máximo.
    """
    matrix: Dict[str, Dict[str, float]] = {}
    for user_id, item_id, weight in rows:
        user_bucket = matrix.setdefault(str(user_id), {})
        item_key = str(item_id)
        user_bucket[item_key] = merge_interaction_weight(
            user_bucket.get(item_key), weight
        )
    return matrix
