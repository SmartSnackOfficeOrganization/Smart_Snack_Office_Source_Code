"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SmartSnackLogo } from "@/components/layout/SmartSnackLogo";
import { PaymentStatusIcon } from "@/components/payments/PaymentStatusIcon";
import { Button } from "@/components/ui/Button";
import { getAuthSession } from "@/lib/auth/session";
import { getCheckoutStatus } from "@/lib/payments/checkout";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 20; // ~40 segundos antes de mostrar el fallback

type ViewState = "checking" | "pending" | "success" | "failed" | "timeout" | "network-error";

export default function PaymentConfirmationPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") ?? "";

  const [viewState, setViewState] = useState<ViewState>("checking");
  const [amount, setAmount] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!reference) {
      setViewState("network-error");
      setErrorMessage("No se encontró la referencia del pago en la URL.");
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const data = await getCheckoutStatus(reference);
        if (cancelled) return;

        if (data.status === "CLO") {
          setAmount(data.amount ?? null);
          setCurrency(data.currency_code ?? null);
          setViewState("success");
          return;
        }

        if (["ERR", "CAN", "EXP", "ERROR"].includes(data.status)) {
          let message = data.failure_message || "Ocurrió un error al procesar el pago.";
          if (String(data.failure_message).includes("403")) {
            message += " (Si el error es 403, logearse primero con el usuario, datos en /payments/management/commands/test_initiate_checkout.py)";
          }
          setErrorMessage(message);
          setViewState("failed");
          return;
        }

        // sigue "pending" / "INIT" / "PEN"
        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
          setViewState("timeout");
          return;
        }
        setViewState("pending");
        setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        if (cancelled) return;
        setErrorMessage(err instanceof Error ? err.message : "Error desconocido");
        setViewState("network-error");
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [reference]);

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
            {(viewState === "checking" || viewState === "pending") && (
              <>
                <PaymentStatusIcon tone="pending" />
                <h1 className="mt-6 text-2xl font-bold text-slate-900">Procesando tu pago…</h1>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
                  Estamos confirmando tu pago con el banco. Esto puede tardar unos segundos, no
                  cierres esta página.
                </p>
              </>
            )}

            {viewState === "success" && (
              <>
                <PaymentStatusIcon tone="success" />
                <h1 className="mt-6 text-2xl font-bold text-slate-900">¡Pago confirmado!</h1>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
                  {amount && currency ? (
                    <>
                      Tu pago de{" "}
                      <span className="font-semibold text-slate-800">
                        {amount} {currency}
                      </span>{" "}
                      fue procesado exitosamente.
                    </>
                  ) : (
                    "Tu pago fue procesado exitosamente."
                  )}
                </p>
                <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
                  <Link href={dashboardHref}>
                    <Button fullWidth>Ir a mi panel</Button>
                  </Link>
                  <Link href="/">
                    <Button variant="secondary" fullWidth>
                      Volver al inicio
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {(viewState === "failed" || viewState === "network-error") && (
              <>
                <PaymentStatusIcon tone="error" />
                <h1 className="mt-6 text-2xl font-bold text-slate-900">No pudimos confirmar tu pago</h1>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
                  {errorMessage || "Ocurrió un problema al procesar tu pago."}
                </p>
                <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
                  <Link href="/">
                    <Button fullWidth>Volver al inicio</Button>
                  </Link>
                </div>
              </>
            )}

            {viewState === "timeout" && (
              <>
                <PaymentStatusIcon tone="pending" />
                <h1 className="mt-6 text-2xl font-bold text-slate-900">Esto está tardando más de lo esperado</h1>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
                  Tu pago sigue en proceso. Puedes revisar el estado más tarde desde tu panel sin
                  perder el progreso.
                </p>
                <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
                  <Link href={dashboardHref}>
                    <Button fullWidth>Ir a mi panel</Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}