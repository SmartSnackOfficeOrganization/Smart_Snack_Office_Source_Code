import { DASHBOARD_ROUTES } from "@/lib/auth/constants";
import { saveAuthSession } from "@/lib/auth/session";
import {
  AuthError,
  AuthSession,
  LoginApiResponse,
  LoginCredentials,
} from "@/lib/auth/types";
import { UserRole } from "@/lib/validation";

const GENERIC_LOGIN_ERROR = "Correo o contraseña incorrectos";

function resolveRoleFromApiResponse(
  response: LoginApiResponse,
): UserRole {
  if (response.role === "buyer" || response.role === "seller") {
    return response.role;
  }

  const payload = decodeJwtPayload(response.access);
  if (payload && typeof payload.role === "string") {
    const role = payload.role as UserRole;
    if (role === "buyer" || role === "seller") {
      return role;
    }
  }

  return "buyer";
}

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

export async function loginWithApi(credentials: LoginCredentials): Promise<AuthSession> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: credentials.email.trim(),
        password: credentials.password,
      }),
    });
  } catch {
    throw new AuthError("NETWORK", GENERIC_LOGIN_ERROR);
  }

  if (response.status === 401) {
    const data = await response.json().catch(() => null);
    const message = extractErrorMessage(data);
    throw new AuthError("INVALID_CREDENTIALS", message);
  }

  if (response.status === 403) {
    const data = await response.json().catch(() => null);
    const message = extractErrorMessage(data);

    if (message.includes("locked") || message.includes("bloqueada")) {
      throw new AuthError("ACCOUNT_LOCKED", message);
    }

    if (message.includes("not active") || message.includes("no activa")) {
      throw new AuthError("USER_NOT_ACTIVE", message);
    }

    throw new AuthError("INVALID_CREDENTIALS", message);
  }

  if (!response.ok) {
    throw new AuthError("INVALID_CREDENTIALS", GENERIC_LOGIN_ERROR);
  }

  const data = (await response.json()) as LoginApiResponse;
  const role = resolveRoleFromApiResponse(data);

  return {
    access: data.access,
    refresh: data.refresh,
    role,
    email: credentials.email.trim().toLowerCase(),
  };
}

function extractErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") return GENERIC_LOGIN_ERROR;

  const obj = data as Record<string, unknown>;
  const nonFieldErrors = obj.non_field_errors;

  if (Array.isArray(nonFieldErrors) && nonFieldErrors.length > 0) {
    return String(nonFieldErrors[0]);
  }

  if (typeof nonFieldErrors === "string") {
    return nonFieldErrors;
  }

  const detail = obj.detail;
  if (typeof detail === "string") {
    return detail;
  }

  return GENERIC_LOGIN_ERROR;
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const session = await loginWithApi(credentials);
  saveAuthSession(session);
  return session;
}

export function getDashboardPath(role: UserRole): string {
  return DASHBOARD_ROUTES[role];
}

export { GENERIC_LOGIN_ERROR };
