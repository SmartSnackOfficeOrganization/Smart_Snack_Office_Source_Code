import { LoginForm } from "@/components/login/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-8">
        <aside className="mb-10 hidden max-w-md lg:block">
          <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white shadow-2xl shadow-brand-900/20">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-200">
              HU-002 · Inicio de sesión
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight">
              Tu acceso seguro al ecosistema Smart Snack
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-brand-100">
              Compradores gestionan pedidos corporativos; vendedores administran su catálogo.
              Autenticación con JWT.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-brand-50">
              <li className="flex items-center gap-2">
                <span className="text-accent-400">●</span> Tokens de acceso y refresco
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent-400">●</span> Redirección automática por rol
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent-400">●</span> Mensajes de error genéricos y seguros
              </li>
            </ul>
          </div>
        </aside>

        <LoginForm />
      </div>
    </main>
  );
}
