import { AuthError } from "@/lib/auth/types";
import { RegistrationFormData } from "@/lib/validation";
import {
  mapRegistrationToApi,
  mapApiErrorsToForm,
  getRegistrationEndpoint,
  ApiFieldErrors,
} from "@/lib/auth/apiTransforms";

const GENERIC_REGISTRATION_ERROR = "Error al crear la cuenta. Intenta de nuevo.";

export interface RegistrationResult {
  success: boolean;
  fieldErrors?: Partial<Record<string, string>>;
  activationUrl?: string;
}

interface RegistrationApiResponse {
  message?: string;
  activation_url?: string;
}

async function registerWithApi(data: RegistrationFormData): Promise<RegistrationResult> {
  const url = getRegistrationEndpoint(data.role);
  const payload = mapRegistrationToApi(data);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AuthError("NETWORK", "Error de conexión. Intenta de nuevo.");
  }

  if (response.status === 201) {
    const data = (await response.json().catch(() => null)) as RegistrationApiResponse | null;
    return {
      success: true,
      activationUrl: data?.activation_url,
    };
  }

  if (response.status === 400) {
    const data = (await response.json().catch(() => null)) as ApiFieldErrors | null;
    if (data) {
      const fieldErrors = mapApiErrorsToForm(data);
      return { success: false, fieldErrors };
    }
  }

  throw new AuthError("REGISTRATION_FAILED", GENERIC_REGISTRATION_ERROR);
}

async function registerWithMock(_data: RegistrationFormData): Promise<RegistrationResult> {
  void _data;
  await new Promise((resolve) => setTimeout(resolve, 900));
  return {
    success: true,
    activationUrl: "/activate/dGVzdA==/mock-token-abc123",
  };
}

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== "false";

export async function register(data: RegistrationFormData): Promise<RegistrationResult> {
  if (USE_MOCK_AUTH) {
    return registerWithMock(data);
  }
  return registerWithApi(data);
}

export { GENERIC_REGISTRATION_ERROR };
