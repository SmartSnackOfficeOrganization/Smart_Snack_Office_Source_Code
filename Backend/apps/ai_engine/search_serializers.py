"""
Serializer de resultados de búsqueda de la HU-05.

Devuelve una vista ligera del producto pensada para el listado de resultados,
más los metadatos de la búsqueda (``relevance_score``, ``match_stage``) y el
placeholder de compatibilidad alimentaria (``is_compatible``).
"""

from rest_framework import serializers

from apps.catalog.models import Product


class SearchResultSerializer(serializers.ModelSerializer):
    """Producto + metadatos de relevancia para el listado de búsqueda."""

    category = serializers.SerializerMethodField()
    relevance_score = serializers.SerializerMethodField()
    match_stage = serializers.SerializerMethodField()
    is_compatible = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "ingredients",
            "price",
            "stock",
            "status",
            "avg_rating",
            "review_count",
            "is_featured",
            "category",
            "relevance_score",
            "match_stage",
            "is_compatible",
        ]

    def get_category(self, obj):
        if obj.category_id and obj.category:
            return obj.category.name
        return None

    def get_relevance_score(self, obj):
        """Score TF-IDF (None si el producto vino de la etapa literal)."""
        return getattr(obj, "relevance_score", None)

    def get_match_stage(self, obj):
        """Etapa que produjo el resultado: "literal" o "tfidf"."""
        return getattr(obj, "match_stage", None)

    def get_is_compatible(self, obj):
        # Placeholder; ver search_service._evaluate_compatibility (TODO HU-06/RF-09).
        return getattr(obj, "is_compatible", None)
