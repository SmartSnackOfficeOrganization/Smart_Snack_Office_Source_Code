"""
Serializer de recomendaciones personalizadas (HU-07).

Forma alineada con el listado de catálogo del frontend (``CatalogProduct``)
más metadatos de afinidad Item-Based CF.
"""

from apps.catalog.models import Product
from apps.catalog.serializers import CategorySerializer
from rest_framework import serializers


class RecommendationProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    tags = serializers.SerializerMethodField()
    affinity_score = serializers.SerializerMethodField()
    source = serializers.SerializerMethodField()
    reason_code = serializers.SerializerMethodField()
    reason = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "stock",
            "status",
            "avg_rating",
            "review_count",
            "is_featured",
            "category",
            "tags",
            "affinity_score",
            "source",
            "reason_code",
            "reason",
        ]

    def get_tags(self, obj):
        return [tag.name for tag in obj.tags.all()]

    def get_affinity_score(self, obj):
        return getattr(obj, "affinity_score", None)

    def get_source(self, obj):
        return getattr(obj, "recommendation_source", None)

    def get_reason_code(self, obj):
        return getattr(obj, "recommendation_reason_code", None)

    def get_reason(self, obj):
        return getattr(obj, "recommendation_reason", None)
