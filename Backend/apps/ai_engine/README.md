# App `ai_engine` — funcionalidades de IA

Alberga las features de Machine Learning del backend. Los modelos viven en `ml/`
(raíz del repo); esta app solo expone los endpoints Django que los sirven.

## Búsqueda inteligente de productos (HU-05 / RF-04)

Búsqueda en dos etapas sobre el catálogo:
1. **Literal:** coincidencia en `name`/`description` de productos activos.
2. **TF-IDF (fallback):** si no hay match literal, ranking por relevancia
   semántica (scikit-learn) sobre nombre + descripción + ingredientes +
   categoría + tags. Motor en `ml/search/tfidf_engine.py`.

- **Endpoint:** `GET /api/catalog/search/?q=<término>&page=<n>&page_size=<m>` (20/página).
- **Archivos:** `search_service.py`, `search_serializers.py`, `search_views.py`,
  `urls.py`, `tests_search.py`.
- **Modelo consumido:** `apps.catalog.models.Product` (la app no define modelos propios).
- **`is_compatible`:** compara `BuyerProfile.allergies` con tags del producto
  (misma regla que el carrito); `null` si no hay usuario/perfil.

## Recomendaciones personalizadas (HU-07 / Item-Based CF)

Item-Based Collaborative Filtering sobre compras (`OrderItem` en estados
`paid`/`shipped`/`delivered`) y calificaciones (`Review.rating`).

1. Matriz usuario–ítem → similitud coseno ítem–ítem (`ml/recommend/item_cf_engine.py`).
2. Ranking por afinidad para el comprador autenticado.
3. Excluye productos ya comprados/calificados, suspendidos y los que violan alergias.
4. Si CF no alcanza el mínimo, completa con popularidad (`avg_rating` / `review_count`).
5. Cache de la matriz de similitud (`item_cf:item_similarity:v1`, TTL 300s).

- **Endpoint:** `GET /api/catalog/recommendations/?limit=5` (buyer autenticado).
- **Elegibilidad:** ≥1 compra relevante **o** ≥1 review; si no, `eligible: false`.
- **Archivos:** `recommendation_service.py`, `recommendation_serializers.py`,
  `recommendation_views.py`, `tests_recommendations.py`, `tests_item_cf_engine.py`.

### Notas de infraestructura
- `ml/` se monta en el contenedor vía `- ./ml:/app/ml` en `Docker-compose.yml`.
- `scikit-learn` está en `Backend/requirements.txt`.
