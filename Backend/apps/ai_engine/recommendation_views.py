"""
Vista de la API de recomendaciones personalizadas (HU-07 / Item-Based CF).

GET /api/catalog/recommendations/?limit=5
"""

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cart.permissions import isBuyer

from .recommendation_serializers import RecommendationProductSerializer
from .recommendation_service import (
    DEFAULT_LIMIT,
    MAX_LIMIT,
    MIN_LIMIT,
    get_recommendations,
)


class ProductRecommendationsView(APIView):
    """
    Recomendaciones Item-Based CF para el comprador autenticado.

    - Requiere rol ``buyer``.
    - Throttling deshabilitado (mismo criterio que search: el rate anónimo
      global es demasiado agresivo para pantallas de inicio/catálogo).
    """

    permission_classes = [IsAuthenticated, isBuyer]
    throttle_classes = []

    def get(self, request):
        raw_limit = request.query_params.get("limit", DEFAULT_LIMIT)
        try:
            limit = int(raw_limit)
        except (TypeError, ValueError):
            limit = DEFAULT_LIMIT
        limit = max(MIN_LIMIT, min(limit, MAX_LIMIT))

        result = get_recommendations(request.user, limit=limit)
        serializer = RecommendationProductSerializer(result.products, many=True)
        return Response(
            {
                "eligible": result.eligible,
                "reason": result.reason,
                "count": len(result.products),
                "results": serializer.data,
            }
        )
