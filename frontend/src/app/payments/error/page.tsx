"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SmartSnackLogo } from "@/components/layout/SmartSnackLogo";
import { PaymentStatusIcon } from "@/components/payments/PaymentStatusIcon";
import { Button } from "@/components/ui/Button";
import { getAuthSession } from "@/lib/auth/session";

export default function PaymentErrorPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const session = getAuthSession();
  const dashboardHref = session?.role === "seller" ? "/seller/dashboard" : "/buyer/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <SmartSnackLogo href={dashboardHref} />
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/40">
          <div className="flex flex-col items-center text-center">
            <PaymentStatusIcon tone="error" />
            <h1 className="mt-6 text-2xl font-bold text-slate-900">Tu pago no se completó</h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
              No logramos procesar tu pago
              {reference && (
                <>
                  {" "}
                  para la orden <span className="font-semibold text-slate-800">{reference}</span>
                </>
              )}
              . No se realizó ningún cargo.
            </p>

            <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
              <Link href={dashboardHref}>
                <Button fullWidth>Intentar de nuevo</Button>
              </Link>
              <Link href={dashboardHref}>
                <Button variant="secondary" fullWidth>
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}