import { AUTH_STORAGE_KEY } from "@/lib/auth/constants";
import { AuthSession, AuthError, TokenRefreshApiResponse } from "@/lib/auth/types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Persistencia de sesión en localStorage (simulación).
 * Para producción con Django, evaluar httpOnly cookies o un store seguro.
 */
export function saveAuthSession(session: AuthSession): void {
  if (!isBrowser()) return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function getAuthSession(): AuthSession | null {
  if (!isBrowser()) return null;

  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function clearAuthSession(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAccessToken(): string | null {
  return getAuthSession()?.access ?? null;
}

export function getRefreshToken(): string | null {
  return getAuthSession()?.refresh ?? null;
}

/**
 * Decodifica un JWT para extraer el payload (sin verificar firma).
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join(""),
    );
    return JSON.parse(jsonPayload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Verifica si un JWT está por expirar (menos de 60 segundos restantes).
 */
export function isTokenExpiring(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp - nowInSeconds < 60;
}

/**
 * Refresca el access token usando el refresh token.
 */
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new AuthError("SESSION_EXPIRED", "Tu sesión ha expirado. Inicia sesión de nuevo.");
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
  } catch {
    throw new AuthError("NETWORK", "Error de conexión. Intenta de nuevo.");
  }

  if (!response.ok) {
    clearAuthSession();
    throw new AuthError("SESSION_EXPIRED", "Tu sesión ha expirado. Inicia sesión de nuevo.");
  }

  const data = (await response.json()) as TokenRefreshApiResponse;
  const session = getAuthSession();

  if (session) {
    saveAuthSession({
      ...session,
      access: data.access,
      refresh: data.refresh ?? refreshToken,
    });
  }

  return data.access;
}

/**
 * Cierra la sesión del usuario en el backend y limpia el localStorage.
 */
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  if (refreshToken) {
    try {
      await fetch(`${baseUrl}/api/auth/logout/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    } catch {
      // Silently ignore logout API errors - clear local session anyway
    }
  }

  clearAuthSession();
}

/**
 * Obtiene un access token válido, refrescando si es necesario.
 */
export async function getValidAccessToken(): Promise<string> {
  const token = getAccessToken();
  if (!token) {
    throw new AuthError("SESSION_EXPIRED", "No hay sesión activa. Inicia sesión.");
  }

  if (isTokenExpiring(token)) {
    return refreshAccessToken();
  }

  return token;
}
