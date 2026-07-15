# Smart Snack Office

Plataforma web universitaria para la venta de snacks saludables en oficinas. Los usuarios pueden registrarse como compradores o vendedores, recuperar contraseñas, y buscar productos mediante un motor de búsqueda inteligente basado en TF-IDF.

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Django 5.2 + Django REST Framework 3.14 |
| Frontend | Next.js 15 + React 19 + TypeScript + Tailwind CSS 4 |
| Base de datos | PostgreSQL 15 |
| Cache | Redis 7 |
| Auth | JWT (SimpleJWT) |
| ML/IA | scikit-learn (TF-IDF) |
| Infraestructura | Docker Compose (4 servicios) |

## Inicio rápido

### Levantar el stack completo

```bash
cd Smart_Snack_Office_Source_Code
docker compose up -d --build
```

Esto inicia los 4 servicios:

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| Frontend | http://localhost:3000 | Interfaz de usuario (Next.js) |
| Backend | http://localhost:8000 | API REST (Django) |
| PostgreSQL | localhost:5432 | Base de datos |
| Redis | localhost:6379 | Cache |

### URLs disponibles

- **Frontend:** http://localhost:3000
- **API Backend:** http://localhost:8000/api/
- **Django Admin:** http://localhost:8000/admin/
- **Swagger/OpenAPI:** http://localhost:8000/api/docs/ (si está configurado)

### Credenciales del Admin Django

| Usuario | Contraseña |
|---------|------------|
| admin@smartsnack.com | Admin123! |

## Variables de entorno

El archivo `.env` (ubicado en la raíz del proyecto) contiene las variables necesarias:

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `DB_NAME` | smartsnack_db | Nombre de la base de datos PostgreSQL |
| `DB_USER` | smartsnack_user | Usuario de PostgreSQL |
| `DB_PASSWORD` | dev_password_123 | Contraseña de PostgreSQL (solo desarrollo) |
| `DB_HOST` | db | Host de PostgreSQL (nombre del servicio Docker) |
| `DB_PORT` | 5432 | Puerto de PostgreSQL |
| `SECRET_KEY` | django-insecure-... | Clave secreta de Django (solo desarrollo) |
| `DEBUG` | True | Modo debug de Django |
| `ALLOWED_HOSTS` | localhost,127.0.0.1,0.0.0.0 | Hosts permitidos |

### Variables del Frontend (Docker)

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | http://localhost:8000 | URL del backend Django |
| `NEXT_PUBLIC_USE_MOCK_AUTH` | false | Usar mock auth (true) o API real (false) |
| `CHOKIDAR_USEPOLLING` | true | File watching para HMR en Docker |

## Funcionalidades implementadas

| HU | Nombre | Descripción |
|----|--------|-------------|
| HU-001 | Registro | Formulario con selector de rol (comprador/vendedor), validación de contraseña, creación de cuenta |
| HU-002 | Login | Autenticación JWT con tokens de acceso y refresco, redirección por rol |
| HU-003 | Recuperación de contraseña | Flujo completo: solicitud → enlace por email → cambio de contraseña |
| HU-005 | Búsqueda inteligente | Motor de búsqueda con TF-IDF, coincidencia literal y semántica, paginación |

## Estructura del proyecto

```
Smart_Snack_Office_Source_Code/
├── Backend/
│   ├── apps/
│   │   ├── authentication/    # Registro, login, JWT, recuperación de contraseña
│   │   ├── catalog/           # Catálogo de productos
│   │   └── ai_engine/         # Motor de búsqueda TF-IDF
│   ├── main_app/              # Configuración de Django
│   ├── requirements.txt       # Dependencias Python
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/               # App Router (Next.js 15)
│   │   ├── components/        # Componentes React
│   │   └── lib/               # Utilidades, auth, catálogo
│   ├── package.json
│   └── Dockerfile
├── ml/                        # Modelos de ML (montado en Docker)
├── Docker-compose.yml
├── .env
└── README.md
```

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

## Desarrollo

### Backend

```bash
cd Backend
python manage.py runserver 0.0.0.0:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Formateo de código (Backend)

```bash
docker exec smartsnack_backend black .
docker exec smartsnack_backend isort .
```

## Ramas

- **main** — Producción
- **develop** — Desarrollo principal
- **feature/*** — Nuevas funcionalidades

Siempre testear las funcionalidades antes de mergear a `develop`.
