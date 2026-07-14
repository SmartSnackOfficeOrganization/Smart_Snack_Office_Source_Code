import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-brand-50 via-white to-accent-50 px-4">
      <div className="text-center">
        <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
          Smart Snack
        </span>
        <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
          Snacks saludables para tu oficina
        </h1>
        <p className="mt-2 max-w-md text-slate-600">
          Bienestar corporativo con energía. Crea tu cuenta para empezar.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/register"
          className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700"
        >
          Crear cuenta
        </Link>
        <Link
          href="/login"
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
        >
          Iniciar sesión
        </Link>
      </div>
    </main>
  );
}
