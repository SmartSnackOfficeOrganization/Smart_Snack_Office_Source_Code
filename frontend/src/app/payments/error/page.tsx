"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SmartSnackLogo } from "@/components/layout/SmartSnackLogo";
import { PaymentStatusIcon } from "@/components/payments/PaymentStatusIcon";
import { Button } from "@/components/ui/Button";
import { getCheckoutStatus, initiateCheckout, CheckoutError } from "@/lib/payments/checkout";

export default function PaymentErrorPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") ?? "";

  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) return;
    // Esta consulta dispara del lado del backend la liberación de la
    // reserva si ya expiró (o si el pago quedó registrado como fallido).
    getCheckoutStatus(reference)
      .then((data) => setOrderStatus(data.status))
      .catch(() => setOrderStatus(null));
  }, [reference]);

  async function handleRetry() {
    setRetryError(null);
    setRetrying(true);
    try {
      const { checkout_url } = await initiateCheckout(reference);
      window.location.href = checkout_url;
    } catch (err) {
      if (err instanceof CheckoutError && err.code === "UNKNOWN") {
        setRetryError("Esta orden ya no está disponible para pagar. Vuelve a agregar los productos al carrito.");
      } else {
        setRetryError("No se pudo reintentar el pago. Intenta de nuevo.");
      }
    } finally {
      setRetrying(false);
    }
  }

  const canRetry = orderStatus === "pending_payment";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <SmartSnackLogo />
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/40">
          <div className="flex flex-col items-center text-center">
            <PaymentStatusIcon tone="error" />
            <h1 className="mt-6 text-2xl font-bold text-slate-900">Tu pago no se completó</h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
              {canRetry
                ? "No se realizó ningún cargo. Puedes intentarlo de nuevo."
                : "El tiempo para completar este pago expiró y los productos ya no están reservados."}
            </p>

            {retryError && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {retryError}
              </p>
            )}

            <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
              {canRetry ? (
                <Button fullWidth onClick={handleRetry} disabled={retrying}>
                  {retrying ? "Redirigiendo…" : "Intentar de nuevo"}
                </Button>
              ) : (
                <Link href="/buyer/catalog">
                  <Button fullWidth>Volver al catálogo</Button>
                </Link>
              )}
              <Link href="/">
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