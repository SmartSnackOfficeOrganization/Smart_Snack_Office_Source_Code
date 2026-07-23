import { AuthError } from "@/lib/auth/types";

export interface ActivationResult {
  success: boolean;
  message: string;
}

async function activateAccountWithApi(uidb64: string, token: string): Promise<ActivationResult> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/auth/activate/${uidb64}/${token}/`, {
      method: "GET",
    });
  } catch {
    throw new AuthError("NETWORK", "Error de conexión. Intenta de nuevo.");
  }

  const data = await response.json().catch(() => null);

  if (response.ok) {
    return {
      success: true,
      message: data?.detail ?? "Cuenta activada correctamente.",
    };
  }

  return {
    success: false,
    message: data?.detail ?? "Enlace de activación inválido o expirado.",
  };
}

async function activateAccountWithMock(
  _uidb64: string,
  _token: string,
): Promise<ActivationResult> {
  void _uidb64;
  void _token;
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    success: true,
    message: "Cuenta activada correctamente (simulación).",
  };
}

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== "false";

export async function activateAccount(
  uidb64: string,
  token: string,
): Promise<ActivationResult> {
  if (USE_MOCK_AUTH) {
    return activateAccountWithMock(uidb64, token);
  }
  return activateAccountWithApi(uidb64, token);
}
