import { AuthError } from "@/lib/auth/types";

interface PasswordResetApiResponse {
  message?: string;
  reset_url?: string;
}

async function requestPasswordResetWithApi(email: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/auth/password-reset/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
  } catch {
    throw new AuthError("NETWORK", "Error de conexión. Intenta de nuevo.");
  }

  if (!response.ok) {
    throw new AuthError("UNKNOWN", "Error al procesar la solicitud. Intenta de nuevo.");
  }

  const data = (await response.json().catch(() => null)) as PasswordResetApiResponse | null;
  return data?.reset_url ?? "";
}

async function requestPasswordResetWithMock(email: string): Promise<string> {
  void email;
  await new Promise((resolve) => setTimeout(resolve, 800));
  return "/reset-password/bW9ja1VpZA==/mock-token-abc123/";
}

async function resetPasswordWithApi(
  uidb64: string,
  token: string,
  newPassword: string,
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/auth/password-reset/confirm/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uidb64,
        token,
        new_password: newPassword,
      }),
    });
  } catch {
    throw new AuthError("NETWORK", "Error de conexión. Intenta de nuevo.");
  }

  if (response.status === 400) {
    const data = await response.json().catch(() => null);
    if (data?.error === "token_expired") {
      throw new AuthError("TOKEN_EXPIRED", "El enlace ha expirado. Solicita uno nuevo.");
    }
    throw new AuthError("TOKEN_INVALID", "El enlace no es válido. Solicita uno nuevo.");
  }

  if (!response.ok) {
    throw new AuthError("UNKNOWN", "Error al restablecer la contraseña. Intenta de nuevo.");
  }
}

async function resetPasswordWithMock(
  uidb64: string,
  token: string,
  _newPassword: string,
): Promise<void> {
  void uidb64;
  void token;
  void _newPassword;
  await new Promise((resolve) => setTimeout(resolve, 800));
}

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== "false";

export async function requestPasswordReset(email: string): Promise<string> {
  if (USE_MOCK_AUTH) {
    return requestPasswordResetWithMock(email);
  }
  return requestPasswordResetWithApi(email);
}

export async function resetPassword(
  uidb64: string,
  token: string,
  newPassword: string,
): Promise<void> {
  if (USE_MOCK_AUTH) {
    await resetPasswordWithMock(uidb64, token, newPassword);
  } else {
    await resetPasswordWithApi(uidb64, token, newPassword);
  }
}
