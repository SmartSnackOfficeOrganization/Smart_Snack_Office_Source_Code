import { getAccessToken } from "@/lib/auth/session";
import { SellerProduct } from "@/lib/seller/catalog.types";

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

async function authHeaders(): Promise<HeadersInit> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export class BuyerProductError extends Error {
  constructor(
    message: string,
    public code: "NETWORK" | "NOT_FOUND" | "UNKNOWN",
  ) {
    super(message);
    this.name = "BuyerProductError";
  }
}

export async function getProductById(id: string): Promise<SellerProduct> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/api/catalog/products/${id}/`, {
      headers: await authHeaders(),
    });
  } catch {
    throw new BuyerProductError("Error de conexión. Intenta de nuevo.", "NETWORK");
  }

  if (response.status === 404) {
    throw new BuyerProductError("Producto no encontrado.", "NOT_FOUND");
  }

  if (!response.ok) {
    throw new BuyerProductError("Error al cargar el producto.", "UNKNOWN");
  }

  return response.json();
}
