import { getValidAccessToken } from "@/lib/auth/session";
import { AuthError } from "@/lib/auth/types";
import {
  CreateProductData,
  UpdateProductData,
  SellerProduct,
  SellerProductListResponse,
} from "@/lib/seller/catalog.types";

export class SellerCatalogError extends Error {
  constructor(
    message: string,
    public code: "NETWORK" | "VALIDATION" | "NOT_FOUND" | "FORBIDDEN" | "UNKNOWN",
  ) {
    super(message);
    this.name = "SellerCatalogError";
  }
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token: string;
  try {
    token = await getValidAccessToken();
  } catch {
    throw new AuthError("SESSION_EXPIRED", "Tu sesión ha expirado. Inicia sesión de nuevo.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string>),
  };

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    throw new SellerCatalogError("Error de conexión. Intenta de nuevo.", "NETWORK");
  }

  return response;
}

export async function listMyProducts(): Promise<SellerProductListResponse> {
  const response = await authFetch(`${getBaseUrl()}/api/catalog/products/`);

  if (!response.ok) {
    throw new SellerCatalogError("Error al cargar productos.", "UNKNOWN");
  }

  return response.json();
}

export async function getProductById(id: string): Promise<SellerProduct> {
  const response = await authFetch(`${getBaseUrl()}/api/catalog/products/${id}/`);

  if (response.status === 404) {
    throw new SellerCatalogError("Producto no encontrado.", "NOT_FOUND");
  }

  if (!response.ok) {
    throw new SellerCatalogError("Error al cargar el producto.", "UNKNOWN");
  }

  return response.json();
}

export async function createProduct(data: CreateProductData): Promise<SellerProduct> {
  const response = await authFetch(`${getBaseUrl()}/api/catalog/products/`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (response.status === 201) {
    return response.json();
  }

  if (response.status === 400) {
    const errors = await response.json().catch(() => null);
    const message = extractErrorMessage(errors);
    throw new SellerCatalogError(message, "VALIDATION");
  }

  if (response.status === 403) {
    throw new SellerCatalogError("No tienes permiso para crear productos.", "FORBIDDEN");
  }

  throw new SellerCatalogError("Error al crear el producto.", "UNKNOWN");
}

export async function updateProduct(
  id: string,
  data: UpdateProductData,
): Promise<SellerProduct> {
  const response = await authFetch(`${getBaseUrl()}/api/catalog/products/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  if (response.ok) {
    return response.json();
  }

  if (response.status === 400) {
    const errors = await response.json().catch(() => null);
    const message = extractErrorMessage(errors);
    throw new SellerCatalogError(message, "VALIDATION");
  }

  if (response.status === 403) {
    throw new SellerCatalogError("No tienes permiso para editar este producto.", "FORBIDDEN");
  }

  if (response.status === 404) {
    throw new SellerCatalogError("Producto no encontrado.", "NOT_FOUND");
  }

  throw new SellerCatalogError("Error al actualizar el producto.", "UNKNOWN");
}

export async function deleteProduct(id: string): Promise<void> {
  const response = await authFetch(`${getBaseUrl()}/api/catalog/products/${id}/`, {
    method: "DELETE",
  });

  if (response.status === 204 || response.status === 200) {
    return;
  }

  if (response.status === 403) {
    throw new SellerCatalogError("No tienes permiso para eliminar este producto.", "FORBIDDEN");
  }

  if (response.status === 404) {
    throw new SellerCatalogError("Producto no encontrado.", "NOT_FOUND");
  }

  throw new SellerCatalogError("Error al eliminar el producto.", "UNKNOWN");
}

function extractErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "Error de validación.";

  const obj = data as Record<string, unknown>;
  const firstKey = Object.keys(obj)[0];
  const firstValue = firstKey ? obj[firstKey] : null;

  if (Array.isArray(firstValue) && firstValue.length > 0) {
    return String(firstValue[0]);
  }

  if (typeof firstValue === "string") {
    return firstValue;
  }

  return "Error de validación.";
}
