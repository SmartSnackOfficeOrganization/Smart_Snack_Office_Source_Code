"""
Vista de la API para la búsqueda inteligente de productos (HU-05 / RF-04).

Expone un endpoint de solo lectura que recibe el término de búsqueda en el
parámetro ``q`` y devuelve los productos ordenados por relevancia, paginados de
a 20 (RF-04: "al menos los 20 más relevantes con paginación").
"""

from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny

from .search_serializers import SearchResultSerializer
from .search_service import search_products


class SearchResultsPagination(PageNumberPagination):
    """Paginación del lado del servidor: 20 productos por página (RF-04)."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class ProductSearchView(ListAPIView):
    """
    GET /api/catalog/search/?q=<término>&page=<n>&page_size=<m>

    - Público (``AllowAny``): el catálogo se puede buscar sin autenticación. Si
      se requiere restringir a compradores, cambiar a ``IsAuthenticated``.
    - Throttling deshabilitado a propósito: el rate global anónimo del proyecto
      es muy bajo (5/hora) y bloquearía la barra de búsqueda. Ajustar a un scope
      propio acorde al RNF-01 durante la integración.
    """

    serializer_class = SearchResultSerializer
    permission_classes = [AllowAny]
    throttle_classes = []
    pagination_class = SearchResultsPagination

    def get_queryset(self):
        query = self.request.query_params.get("q", "").strip()
        if not query:
            raise ValidationError({"q": "El parámetro de búsqueda 'q' es obligatorio."})
        user = self.request.user if self.request.user.is_authenticated else None
        return search_products(query, user=user)
