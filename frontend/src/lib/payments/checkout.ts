import { getAccessToken } from "@/lib/auth/session";

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

async function authHeaders(): Promise<HeadersInit> {
  const token = getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export class CheckoutError extends Error {
  constructor(
    message: string,
    public code: "NETWORK" | "AUTH" | "GATEWAY" | "UNKNOWN",
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

export interface CheckoutResponse {
  reference: string;
  checkout_url: string;
}

export interface CheckoutStatus {
  merchant_reference_id: string;
  status: string;
  paid: boolean;
  amount: string | null;
  currency_code: string | null;
  failure_message: string | null;
  created_at: string | null;
}

export async function initiateCheckout(
  amount: number,
  currency = "COP",
  country = "CO",
  reference?: string,
): Promise<CheckoutResponse> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/payments/checkout/`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({
        amount: amount.toFixed(2),
        currency,
        country,
        ...(reference ? { reference } : {}),
      }),
    });

    if (response.status === 401 || response.status === 403) {
      throw new CheckoutError(
        "Debes iniciar sesión como comprador.",
        "AUTH",
      );
    }

    if (response.status === 502) {
      const data = await response.json();
      throw new CheckoutError(
        data.detail || "Error al comunicarse con la pasarela de pago.",
        "GATEWAY",
      );
    }

    if (!response.ok) {
      const data = await response.json();
      const msg =
        typeof data === "string"
          ? data
          : data.detail || "Error al iniciar el pago.";
      throw new CheckoutError(msg, "UNKNOWN");
    }

    return response.json();
  } catch (err) {
    if (err instanceof CheckoutError) throw err;
    throw new CheckoutError("Error de conexión. Intenta de nuevo.", "NETWORK");
  }
}

export async function getCheckoutStatus(
  reference: string,
): Promise<CheckoutStatus> {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/payments/status/${encodeURIComponent(reference)}/`,
      { headers: await authHeaders() },
    );

    if (response.status === 403) {
      throw new CheckoutError("No autorizado.", "AUTH");
    }

    if (!response.ok) {
      throw new CheckoutError("Error al consultar el estado del pago.", "UNKNOWN");
    }

    return response.json();
  } catch (err) {
    if (err instanceof CheckoutError) throw err;
    throw new CheckoutError("Error de conexión. Intenta de nuevo.", "NETWORK");
  }
}
