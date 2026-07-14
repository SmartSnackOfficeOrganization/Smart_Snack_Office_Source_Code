# Smart Snack — Frontend

Next.js 15 + Tailwind CSS 4 + TypeScript.

## Desarrollo local

```bash
cd frontend
npm install
cp env.local.example .env.local   # opcional
npm run dev
```

Abre [http://localhost:3000/register](http://localhost:3000/register) para la vista HU-001.
Abre [http://localhost:3000/login](http://localhost:3000/login) para la vista HU-002.

### Credenciales simuladas (login)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Comprador | comprador@empresa.com | ContraseñaSegura123! |
| Vendedor | vendedor@empresa.com | ContraseñaSegura123! |

## Estructura

```
src/
├── app/
│   ├── register/           # HU-001 Registro
│   ├── login/              # HU-002 Login JWT
│   ├── buyer/dashboard/    # Panel comprador (placeholder)
│   └── seller/dashboard/   # Panel vendedor (placeholder)
├── components/
│   ├── ui/                 # Button, FormField
│   ├── layout/             # SmartSnackLogo
│   ├── register/           # Formulario de registro
│   ├── login/              # Formulario de login
│   └── dashboard/          # Shell de paneles
└── lib/
    ├── validation.ts       # Validaciones cliente
    └── auth/               # Sesión JWT, login simulado/API
        ├── login.ts
        ├── session.ts
        ├── types.ts
        └── constants.ts
```

## Autenticación (HU-002)

- **Simulación activa** por defecto (`NEXT_PUBLIC_USE_MOCK_AUTH=true`).
- Tokens guardados en **localStorage** vía `lib/auth/session.ts` (fácil de migrar a cookies).
- Redirección por rol: `/buyer/dashboard` o `/seller/dashboard`.
- Para conectar Django: `NEXT_PUBLIC_USE_MOCK_AUTH=false` y usar `POST /api/auth/login/`.

## Tests

### Configuración

El frontend utiliza **Jest** + **React Testing Library** para tests unitarios y de componentes.
Configuración automática vía `next/jest`.

### Comandos

```bash
npm run test            # Ejecutar todos los tests
npm run test:watch      # Modo watch (re-ejecuta al guardar)
npm run test:coverage   # Generar reporte de cobertura
```

### Estructura de tests

Los tests siguen la misma estructura que el código fuente:

```
src/
├── lib/
│   ├── validation.test.ts              # Validaciones de formularios
│   └── auth/
│       ├── types.test.ts               # AuthError class
│       ├── constants.test.ts           # Constantes de autenticación
│       ├── session.test.ts             # CRUD de sesión en localStorage
│       └── login.test.ts              # Lógica de login mock/API
├── components/
│   ├── ui/
│   │   ├── Button.test.tsx            # Variantes, fullWidth, disabled
│   │   └── FormField.test.tsx         # Labels, errors, hints, aria
│   ├── register/
│   │   ├── RoleSelector.test.tsx      # Radio group de roles
│   │   ├── PasswordCriteriaList.test.tsx   # Evalúa criteria de contraseña
│   │   ├── RegistrationSuccess.test.tsx    # Pantalla de éxito
│   │   └── RegistrationForm.test.tsx       # Flujo completo de registro
│   ├── login/
│   │   └── LoginForm.test.tsx         # Flujo completo de login
│   ├── dashboard/
│   │   └── DashboardShell.test.tsx    # Auth guard, logout
│   └── layout/
│       └── SmartSnackLogo.test.tsx    # Renderizado del logo
└── app/
    ├── page.test.tsx                  # Home page
    ├── login/page.test.tsx            # Login page
    ├── register/page.test.tsx         # Register page
    ├── buyer/dashboard/page.test.tsx
    └── seller/dashboard/page.test.tsx
```

### Qué se testea

| Nivel | Qué cubre | Herramienta |
|---|---|---|
| Unit tests | Funciones de validación, auth, session, login | Jest |
| Component tests (UI) | Button, FormField, RoleSelector, etc. | Jest + RTL |
| Component tests (estado) | LoginForm, RegistrationForm, DashboardShell | Jest + RTL + userEvent |
| Page smoke tests | Exportación de cada página | Jest + RTL |

### Mocks

Los tests utilizan mocks para:
- **localStorage** — Simular persistencia de sesión
- **next/navigation** — Verificar redirecciones (useRouter)
- **fetch** — Simular llamadas API en loginWithApi
- **process.env** — Variables de entorno de Next.js
