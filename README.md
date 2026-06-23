# Smart_Snack_Office_Source_Code
Codigo fuente de la página web.



---


## Puesta en marcha (primera vez)

Tener instalado Docker Desktop

```bash
# 1. Clonar el repositorio
git clone https://github.com/SmartSnackOfficeOrganization/Smart_Snack_Office_Source_Code.git
cd SmartSnack

# 2. Crear archivo de variables de entorno a partir de la plantilla
cp Backend/.env.example Backend/.env
#   En Windows (CMD):  copy Backend\.env.example Backend\.env

# 3. Editar Backend/.env y rellenar los valores
#    (los valores por defecto de la plantilla sirven para desarrollo local)

# 4. Construir y levantar todos los servicios
docker compose up --build
```

Cuando termine de levantar, abre el navegador en:

- **Backend (API Django):** http://localhost:8000
- **Base de datos PostgreSQL:** localhost:5432

---

## Variables de entorno para local

El proyecto necesita un archivo `Backend/.env` (NO se sube a Git).
Usar `Backend/.env.example` como plantilla. Variables requeridas:

| Variable | Descripción | Ejemplo (desarrollo local) |
|---|---|---|
| `DB_NAME` | Nombre de la base de datos | `smartsnack_db` |
| `DB_USER` | Usuario de PostgreSQL | `smartsnack_user` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `dev_password_123` |
| `DB_HOST` | Host de la base de datos (nombre del servicio en Docker compose) | `db` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `SECRET_KEY` | Clave secreta de Django | `django-insecure-...` |
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

# Ver logs de un servicio
docker logs smartsnack_backend
docker logs smartsnack_db
```

---


## Flujo de trabajo con Git

**RAMAS**

```bash
Main	← código estable, versiones grandes del proyecto (Sprints), lo que está "entregable". Casi nunca se toca directo.
  ↑
Develop	← rama de integración. Aquí se junta el trabajo de todos. ¡Protegida!: No se puede hacer push directo, todo entra por Pull Request.  El Pull Request necesita al menos 1 aprobación de otro miembro antes de mergear.  El CI debe pasar (los tests y el linter de GitHub Actions en verde) antes de poder mergear.
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
