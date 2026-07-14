"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SmartSnackLogo } from "@/components/layout/SmartSnackLogo";
import { Button } from "@/components/ui/Button";
import { clearAuthSession, getAuthSession } from "@/lib/auth/session";
import { AuthSession } from "@/lib/auth/types";

interface DashboardShellProps {
  role: "buyer" | "seller";
  title: string;
  description: string;
}

export function DashboardShell({ role, title, description }: DashboardShellProps) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const current = getAuthSession();
    if (!current || current.role !== role) {
      router.replace("/login");
      return;
    }
    setSession(current);
  }, [role, router]);

  function handleLogout() {
    clearAuthSession();
    router.push("/login");
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Verificando sesión…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <SmartSnackLogo />
          <Button variant="secondary" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/40">
          <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
            Panel {role === "buyer" ? "Comprador" : "Vendedor"}
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
          <p className="mt-4 text-sm text-slate-500">
            Sesión activa: <span className="font-medium text-slate-700">{session.email}</span>
          </p>

          <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Tokens JWT (simulados)</p>
            <p className="mt-2 break-all">
              <span className="font-medium">Access:</span> {session.access.slice(0, 48)}…
            </p>
            <p className="mt-1 break-all">
              <span className="font-medium">Refresh:</span> {session.refresh.slice(0, 48)}…
            </p>
          </div>

          <Link
            href="/"
            className="mt-6 inline-block text-sm font-semibold text-brand-700 hover:underline"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
