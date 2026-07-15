"use client";

import { use } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SmartSnackLogo } from "@/components/layout/SmartSnackLogo";
import { Button } from "@/components/ui/Button";
import { activateAccount } from "@/lib/auth/activation";

interface ActivatePageProps {
  params: Promise<{ uidb64: string; token: string }>;
}

export default function ActivatePage({ params }: ActivatePageProps) {
  const { uidb64, token } = use(params);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function activate() {
      try {
        const result = await activateAccount(uidb64, token);
        if (!cancelled) {
          setStatus(result.success ? "success" : "error");
          setMessage(result.message);
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Error al activar la cuenta. Intenta de nuevo.");
        }
      }
    }

    activate();
    return () => {
      cancelled = true;
    };
  }, [uidb64, token]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-8">
        <aside className="mb-10 hidden max-w-md lg:block">
          <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white shadow-2xl shadow-brand-900/20">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-200">
              Activación de cuenta
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight">
              Verifica tu correo electrónico
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-brand-100">
              Tu cuenta está siendo activada. Esto solo tomará un momento.
            </p>
          </div>
        </aside>

        <div className="w-full max-w-lg">
          <div className="mb-8 text-center sm:text-left">
            <SmartSnackLogo />
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
            {status === "loading" && (
              <div className="flex flex-col items-center py-8">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
                <p className="mt-4 text-sm text-slate-600">Activando tu cuenta…</p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center py-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl shadow-inner">
                  ✅
                </div>
                <h2 className="mt-6 text-2xl font-bold text-slate-900">¡Cuenta activada!</h2>
                <p className="mt-3 max-w-sm text-center text-sm text-slate-600">{message}</p>
                <div className="mt-8 w-full max-w-xs">
                  <Link href="/login">
                    <Button fullWidth>Iniciar sesión</Button>
                  </Link>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center py-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-4xl shadow-inner">
                  ❌
                </div>
                <h2 className="mt-6 text-2xl font-bold text-slate-900">Error de activación</h2>
                <p className="mt-3 max-w-sm text-center text-sm text-slate-600">{message}</p>
                <div className="mt-8 w-full max-w-xs space-y-3">
                  <Link href="/register">
                    <Button fullWidth>Crear nueva cuenta</Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="secondary" fullWidth>
                      Ir a iniciar sesión
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
