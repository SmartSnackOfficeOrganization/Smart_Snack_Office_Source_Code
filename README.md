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
python manage.py test apps.payments                   # Solo pasarela pagos

### Pasarela pagos
docker exec -it smartsnack_backend python manage.py test_initiate_checkout # Inicia un pago con un usuario mock y una orden mock. Verifica la creacion de firmas, checkout en la pasarela de pagos y callback del webhook.

docker exec -it smartsnack_backend python manage.py test_rapyd_chechout # Verifica únicamente la creacion de firmas, checkout en la pasarela de pagos y callback del webhook.

docker exec -it smartsnack_backend python manage.py create_test_user # Crea un usuario (deprecated). Ya hay frontend funcional que se encarga de eso.

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

