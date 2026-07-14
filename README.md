# Smart_Snack_Office_Source_Code
Codigo fuente de la página web

## Testing

### Backend (Django)

```bash
cd Backend
python manage.py test                                # Todos los tests
python manage.py test apps.authentication             # Solo auth
python manage.py test apps.catalog                    # Solo catálogo
python manage.py test apps.ai_engine                  # Solo motor de búsqueda
```

### Frontend (Next.js)

```bash
cd frontend
npm run test              # Todos los tests
npm run test:watch        # Modo watch
npm run test:coverage     # Con cobertura
```

### Linting

```bash
# Backend
cd Backend
black --check .
isort --check-only .

# Frontend
cd frontend
npm run lint
```
