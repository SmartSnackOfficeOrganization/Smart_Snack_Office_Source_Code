import { UserRole } from "@/lib/validation";

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthSession extends AuthTokens {
  role: UserRole;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export class AuthError extends Error {
  constructor(
    public readonly code:
      | "INVALID_CREDENTIALS"
      | "NETWORK"
      | "UNKNOWN"
      | "USER_NOT_FOUND"
      | "TOKEN_EXPIRED"
      | "TOKEN_INVALID"
      | "ACCOUNT_LOCKED"
      | "USER_NOT_ACTIVE"
      | "REGISTRATION_FAILED"
      | "SESSION_EXPIRED",
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** Respuesta esperada de POST /api/auth/login/ (Django + SimpleJWT) */
export interface LoginApiResponse {
  access: string;
  refresh: string;
}

/** Respuesta de error del backend Django */
export interface ApiErrorResponse {
  [field: string]: string[] | string;
}

/** Token refresh response */
export interface TokenRefreshApiResponse {
  access: string;
  refresh?: string;
}
