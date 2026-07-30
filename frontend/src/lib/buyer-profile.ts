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

export interface BuyerProfileData {
  email: string;
  full_name: string;
  role: string;
  delivery_address: string | null;
  company_name: string | null;
  allergies: string[];
}

export async function getBuyerProfile(): Promise<BuyerProfileData> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("No autenticado.");
  }
  const response = await fetch(`${getBaseUrl()}/api/auth/profile/`, {
    headers: await authHeaders(),
  });
  if (!response.ok) {
    throw new Error("Error al cargar el perfil.");
  }
  return response.json();
}

export async function updateBuyerProfile(
  data: Partial<Pick<BuyerProfileData, "delivery_address" | "company_name" | "allergies">>,
): Promise<BuyerProfileData> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("No autenticado.");
  }
  const response = await fetch(`${getBaseUrl()}/api/auth/profile/`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    const msg =
      err && typeof err === "object"
        ? Object.values(err).flat().join(" ")
        : "Error al actualizar el perfil.";
    throw new Error(msg);
  }
  return response.json();
}
