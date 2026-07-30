# Smart_Snack_Office_Source_Code
Codigo fuente de la página web.

SOLO SE VA A MANEJAR DE MANERA LOCAL, no se va a desplegar.
Hacer testeo de la feature antes de integrar/mergear a develop, que no se vaya a romper nada.
---


## Puesta en marcha (primera vez)

Tener instalado Docker Desktop y corriendo en segundo plano.

```bash
# 1. Clonar el repositorio
git clone https://github.com/SmartSnackOfficeOrganization/Smart_Snack_Office_Source_Code.git
cd Smart_Snack_Office_Source_Code

# 2. Crear archivo de variables de entorno a partir de la plantilla
cp Backend/.env.example Backend/.env
#   En Windows (CMD):  copy Backend\.env.example Backend\.env

# 3. Editar Backend/.env y rellenar los valores
#    (los valores por defecto de la plantilla sirven para desarrollo local)

# 4. Construir y levantar todos los servicios
docker compose up --build
```

- **Base de datos PostgreSQL:** localhost:5432

---

## Variables de entorno para local

Usar `Backend/.env.example` como plantilla. Variables requeridas:

| Variable | Descripción | Ejemplo (desarrollo local) |
|---|---|---|
| `DB_NAME` | Nombre de la base de datos | `smartsnack_db` |
| `DB_USER` | Usuario de PostgreSQL | `smartsnack_user` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `dev_password_123` |
| `DB_HOST` | Host de la base de datos (nombre del servicio en Docker compose) | `db` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `SECRET_KEY` | Clave secreta de Django | `django-insecure--clave-larga-solo-para-desarrollo` |
| `DEBUG` | Modo debug (True solo en desarrollo) | `True` |
| `ALLOWED_HOSTS` | Hosts permitidos, separados por coma | `localhost,127.0.0.1,0.0.0.0` |

> **Importante:** `DB_HOST` debe ser `db` (el nombre del servicio en docker-compose).

---

## Uso diario

```bash
# Levantar el proyecto (sin reconstruir)
docker compose up

# Levantar en segundo plano (libera la terminal)
docker compose up -d

# Apagar todos los servicios
docker compose down

# Apagar Y borrar la base de datos (resetea todo)
docker compose down -v

# Reconstruir tras cambios en el Dockerfile o requirements.txt
docker compose up --build
```

---

## Comandos útiles (dentro del contenedor)

```bash
# Abrir una terminal dentro del contenedor del backend
docker exec -it smartsnack_backend sh

# Crear migraciones tras cambiar modelos
docker exec -it smartsnack_backend python manage.py makemigrations

# Aplicar migraciones manualmente
docker exec -it smartsnack_backend python manage.py migrate

# Crear un superusuario de Django
docker exec -it smartsnack_backend python manage.py createsuperuser

# corre los tests de Django. Para verificar que el código no rompe nada antes de abrir un PR.
docker exec -it smartsnack_backend python manage.py test

# Ver logs de un servicio
docker logs smartsnack_backend
docker logs smartsnack_db

# Aplicar formateo black e isort para que pase CI
docker exec smartsnack_backend black .
docker exec smartsnack_backend isort .

# Verifica EXACTAMENTE lo que corre el CI (ambos deben salir en 0):
docker exec smartsnack_backend black --check .
docker exec smartsnack_backend isort --check-only .
```

---


## Flujo de trabajo con Git

**RAMAS**

```bash
Main	← código estable, versiones grandes del proyecto (Sprints), lo que está "entregable". Casi nunca se toca directo.
  ↑
Develop	← rama de integración. Aquí se junta el trabajo de todos. (para después) Protegerla: No se puede hacer push directo, todo entra por Pull Request. El Pull Request necesita al menos 1 aprobación de otro miembro antes de mergear. El CI debe pasar (los tests y el linter de GitHub Actions en verde) antes de poder mergear.
  ↑
feature/HU-001 o issue…     ← una rama por cada HU o issue que alguien esté desarrollando.

Usar Conventional Commits (feat:, fix:, docs:, test:)
```


**Flujo commits / HUs**

```bash
# 1. Actualizar develop antes de empezar
git checkout develop
git pull origin develop

# 2. Crear una rama para la Historia de Usuario
git checkout -b feature/HU-XXX-nombre-corto

# 3. Trabajar y hacer commits pequeños (Conventional Commits)
git add .
git commit -m "feat: descripcion breve del cambio"

# 4. Actualizar con develop antes de subir
git fetch origin
git merge origin/develop

# 5. Subir la rama y abrir un Pull Request hacia develop
git push -u origin feature/HU-XXX-nombre-corto
```

En prueba: **Vincular el PR a su issue (si la hay).** En la descripción del Pull Request, escribor `Closes #N` (número del issue),
al mergear, el issue se cierra solo y la tarjeta del tablero pasa a "Done" automáticamente.


---

## Estructura del repositorio

```
SmartSnack/
├── .github/workflows/   Workflows de GitHub Actions (CI)
├── Backend/             API Django REST Framework
│   ├── config/          Proyecto Django (settings, urls, celery)
│   └── apps/            Apps por servicio (auth, catalog, orders, ai_engine...)
├── frontend/            Aplicación Next.js
├── ml/                  Modelos de Scikit-learn (CF, TF-IDF)
├── docs/                Documentación (ERD, API, decisiones)
├── docker-compose.yml   Orquestación de servicios
└── README.md
```

---

## Equipo

| Rol | Integrante |
|---|---|
| Backend | Juan Sebastián Leguizamón, Juan José Roldán |
| Frontend | Nelson Pineda |
| Testing | Samuel Castañeda |
| DevOps / Integración IA | Daniel Duitama |
| Documentación / PM | Pablo Olaya / Daniel Duitama |
=======
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
