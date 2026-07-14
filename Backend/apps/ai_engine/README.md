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

### Notas de infraestructura
- `ml/` se monta en el contenedor vía `- ./ml:/app/ml` en `Docker-compose.yml`.
- `scikit-learn` está en `Backend/requirements.txt`.

### Limitaciones / TODO
- `is_compatible` sale `null` (placeholder): el marcado por restricciones
  alimentarias (RF-04) depende de HU-06/RF-09, que aún no tiene modelo.

## Recomendaciones (HU-07 / Item-based CF) — pendiente

Cuando se implemente: el modelo entrenado va en `ml/`, y el servicio + la vista
DRF en esta app, reutilizando el mismo patrón (motor en `ml/` + servicio + vista).
