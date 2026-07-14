"use client";

import { use } from "react";
import { ResetPasswordForm } from "@/components/reset-password/ResetPasswordForm";

interface ResetPasswordPageProps {
  params: Promise<{ uidb64: string; token: string }>;
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { uidb64, token } = use(params);

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-8">
        <aside className="mb-10 hidden max-w-md lg:block">
          <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white shadow-2xl shadow-brand-900/20">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-200">
              HU-003 · Nueva contraseña
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight">
              Establece tu nueva contraseña
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-brand-100">
              Elige una contraseña segura que cumpla con todos los criterios de seguridad.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-brand-50">
              <li className="flex items-center gap-2">
                <span className="text-accent-400">●</span> Mínimo 8 caracteres
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent-400">●</span> Mayúsculas y minúsculas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent-400">●</span> Al menos un número
              </li>
            </ul>
          </div>
        </aside>

        <ResetPasswordForm uidb64={uidb64} token={token} />
      </div>
    </main>
  );
}
