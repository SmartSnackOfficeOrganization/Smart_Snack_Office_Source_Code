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
