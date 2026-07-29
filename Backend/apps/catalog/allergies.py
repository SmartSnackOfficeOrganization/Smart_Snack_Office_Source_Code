"""
Utilidades compartidas para restricciones alimentarias del comprador.

La regla de negocio es la misma que aplica el carrito: un producto viola las
alergias del usuario cuando alguno de sus tags coincide (case-insensitive)
con una entrada de ``BuyerProfile.allergies``.
"""

from __future__ import annotations

from typing import Iterable, Sequence


def matching_allergens(
    allergies: Sequence[str] | None,
    product_tag_names: Iterable[str],
) -> list[str]:
    """Devuelve los alérgenos del perfil que coinciden con tags del producto."""
    if not allergies:
        return []
    tags_lower = {name.lower() for name in product_tag_names}
    return [allergen for allergen in allergies if allergen.lower() in tags_lower]


def product_is_compatible(
    allergies: Sequence[str] | None,
    product_tag_names: Iterable[str],
) -> bool:
    """True si el producto no viola las alergias configuradas."""
    return not matching_allergens(allergies, product_tag_names)
