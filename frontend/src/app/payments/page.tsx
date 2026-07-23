"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getCheckoutStatus } from "@/lib/payments/checkout";

export default function CheckoutConfirmationPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") ?? "";
  const [status, setStatus] = useState<string>("pending");

  useEffect(() => {
    if (!reference) return;

    const interval = setInterval(async () => {
      const data = await getCheckoutStatus(reference);
      setStatus(data.status);
      if (data.status !== "pending") clearInterval(interval);
    }, 2000);

    return () => clearInterval(interval);
  }, [reference]);

  if (status === "pending") return <p>Procesando tu pago…</p>;
  if (status === "CLO") return <p>¡Pago confirmado! 🎉</p>;
  return <p>Tu pago no se completó ({status}).</p>;
}