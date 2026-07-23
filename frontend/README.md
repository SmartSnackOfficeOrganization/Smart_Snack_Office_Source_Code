# Smart Snack — Frontend

Next.js 15 + React 19 + Tailwind CSS 4 + TypeScript.

## Desarrollo local

### Opción 1: Docker (recomendado)

```bash
docker compose up -d --build frontend
```

### Opción 2: Node.js local

```bash
cd frontend
npm install
cp env.local.example .env.local   # opcional
npm run dev
```

### URLs

| Ruta | Descripción |
|------|-------------|
| `/register` | HU-001 Registro de usuario |
| `/login` | HU-002 Login JWT |
| `/forgot-password` | HU-003 Solicitud de recuperación |
| `/reset-password/[uidb64]/[token]` | HU-003 Cambio de contraseña |
| `/activate/[uidb64]/[token]` | Activación de cuenta |
| `/buyer/dashboard` | Panel del comprador |
| `/buyer/search` | HU-005 Búsqueda inteligente |
| `/seller/dashboard` | Panel del vendedor |

### Django Admin

| URL | Usuario | Contraseña |
|-----|---------|------------|
| http://localhost:8000/admin/ | admin@smartsnack.com | Admin123! |

Panel de administración para gestionar usuarios (compradores/vendedores), perfiles, y catálogo de productos.

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `NEXT_PUBLIC_API_URL` | URL del backend Django | `http://localhost:8000` |

## Autenticación

El frontend está conectado al backend Django. El flujo de autenticación utiliza JWT con tokens de acceso y refresco.

- **Registro:** `POST /api/auth/register/buyer/` o `POST /api/auth/register/seller/`
- **Login:** `POST /api/auth/login/` → retorna `{ access, refresh }`
- **Logout:** `POST /api/auth/logout/` → blacklisteа el refresh token
- **Activación:** `GET /api/auth/activate/<uidb64>/<token>/`
- **Reset contraseña:** `POST /api/auth/password-reset/` → retorna `reset_url`
- **Confirmar reset:** `POST /api/auth/password-reset/confirm/`

## Funcionalidades

### HU-001 — Registro

Formulario con selector de rol (comprador/vendedor), validación de contraseña con criteria en tiempo real, y pantalla de éxito con enlace de activación.

**Ruta:** `/register`

### HU-002 — Login

Autenticación JWT con manejo de errores del backend, redirección por rol a dashboards correspondientes.

**Ruta:** `/login`

### HU-003 — Recuperación de contraseña

Flujo completo en 3 pasos:
1. **Solicitud** (`/forgot-password`): El usuario ingresa su email
2. **Redirección automática**: El backend genera un enlace de reset y el frontend lo redirige automáticamente al formulario de cambio
3. **Cambio** (`/reset-password/[uidb64]/[token]`): Formulario con validación de criteria de contraseña

### HU-005 — Búsqueda inteligente

Barra de búsqueda en el header del panel del comprador. Motor de búsqueda TF-IDF con coincidencia literal y semántica. Resultados paginados con badges de `match_stage` (literal/tfidf).

**Ruta:** `/buyer/search?q=<término>`

### Activación de cuenta

Después del registro, se genera un enlace de activación. El usuario puede activar su cuenta desde la pantalla de éxito o desde el enlace enviado por email.

**Ruta:** `/activate/[uidb64]/[token]`

## Estructura

```
src/
├── app/
│   ├── activate/[uidb64]/[token]/    # Activación de cuenta
│   ├── buyer/
│   │   ├── dashboard/                # Panel comprador
│   │   └── search/                   # HU-005 Búsqueda
│   ├── forgot-password/              # HU-003 Solicitud reset
│   ├── login/                        # HU-002 Login JWT
│   ├── register/                     # HU-001 Registro
│   ├── reset-password/[uidb64]/[token]/ # HU-003 Cambio contraseña
│   └── seller/dashboard/             # Panel vendedor
├── components/
│   ├── dashboard/                    # DashboardShell
│   ├── forgot-password/              # ForgotPasswordForm
│   ├── layout/                       # SmartSnackLogo
│   ├── login/                        # LoginForm
│   ├── register/                     # RegistrationForm, RoleSelector, etc.
│   ├── reset-password/               # ResetPasswordForm
│   ├── search/                       # SearchBar, SearchResults, NoResults
│   └── ui/                           # Button, FormField
└── lib/
    ├── auth/
    │   ├── activation.ts             # API de activación
    │   ├── apiTransforms.ts          # Mapeo camelCase ↔ snake_case
    │   ├── constants.ts              # Constantes de auth
    │   ├── login.ts                  # Lógica de login API
    │   ├── passwordReset.ts          # Solicitud y cambio de contraseña
    │   ├── registration.ts           # Registro via API
    │   ├── session.ts                # Tokens JWT, refresh, logout
    │   └── types.ts                  # Tipos de auth
    ├── catalog.ts                    # API de búsqueda de productos
    ├── catalog.types.ts              # Tipos de catálogo
    └── validation.ts                 # Validaciones de formularios
```

## Tests

### Configuración

El frontend utiliza **Jest** + **React Testing Library** para tests unitarios y de componentes.
Configuración automática vía `next/jest`.

### Comandos

```bash
npm run test            # Ejecutar todos los tests (213 tests)
npm run test:watch      # Modo watch (re-ejecuta al guardar)
npm run test:coverage   # Generar reporte de cobertura
```

### Archivos de test

```
src/
├── lib/
│   ├── auth/
│   │   ├── activation.test.ts
│   │   ├── apiTransforms.test.ts
│   │   ├── constants.test.ts
│   │   ├── login.test.ts
│   │   ├── passwordReset.test.ts
│   │   ├── registration.test.ts
│   │   ├── session.test.ts
│   │   └── types.test.ts
│   ├── catalog.test.ts
│   └── validation.test.ts
├── components/
│   ├── dashboard/DashboardShell.test.tsx
│   ├── forgot-password/ForgotPasswordForm.test.tsx
│   ├── layout/SmartSnackLogo.test.tsx
│   ├── login/LoginForm.test.tsx
│   ├── register/
│   │   ├── PasswordCriteriaList.test.tsx
│   │   ├── RegistrationForm.test.tsx
│   │   ├── RegistrationSuccess.test.tsx
│   │   └── RoleSelector.test.tsx
│   ├── reset-password/ResetPasswordForm.test.tsx
│   ├── search/
│   │   ├── NoResults.test.tsx
│   │   ├── SearchBar.test.tsx
│   │   └── SearchResults.test.tsx
│   └── ui/
│       ├── Button.test.tsx
│       └── FormField.test.tsx
└── app/
    ├── page.test.tsx
    ├── login/page.test.tsx
    ├── register/page.test.tsx
    ├── buyer/dashboard/page.test.tsx
    └── seller/dashboard/page.test.tsx
```

### Qué se testea

| Nivel | Qué cubre | Herramienta |
|---|---|---|
| Unit tests | Funciones de validación, auth, session, login, catálogo, transforms | Jest |
| Component tests (UI) | Button, FormField, RoleSelector, SearchBar, SearchResults, NoResults | Jest + RTL |
| Component tests (estado) | LoginForm, RegistrationForm, ForgotPasswordForm, ResetPasswordForm, DashboardShell | Jest + RTL + userEvent |
| Page smoke tests | Exportación de cada página | Jest + RTL |

### Mocks

Los tests utilizan mocks para:
- **localStorage** — Simular persistencia de sesión
- **next/navigation** — Verificar redirecciones (useRouter)
- **fetch** — Simular llamadas API
- **process.env** — Variables de entorno de Next.js
