import { getAccessToken } from "@/lib/auth/session";
import { CartItem, CartListResponse } from "./cart.types";

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

async function authHeaders(): Promise<HeadersInit> {
  const token = getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export class CartError extends Error {
  constructor(
    message: string,
    public code: "NETWORK" | "STOCK" | "ALLERGY" | "AUTH" | "UNKNOWN",
    public allergens?: string[],
  ) {
    super(message);
    this.name = "CartError";
  }
}

export async function getCartItems(): Promise<CartListResponse> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/cart/items/`, {
      headers: await authHeaders(),
    });
    if (response.status === 401 || response.status === 403) {
      throw new CartError("Debes iniciar sesión como comprador.", "AUTH");
    }
    if (!response.ok) throw new CartError("Error al cargar el carrito.", "UNKNOWN");
    return response.json();
  } catch (err) {
    if (err instanceof CartError) throw err;
    throw new CartError("Error de conexión. Intenta de nuevo.", "NETWORK");
  }
}

export async function addToCart(productId: string, quantity = 1): Promise<CartItem> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/cart/items/`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    if (response.status === 401 || response.status === 403) {
      throw new CartError("Debes iniciar sesión como comprador.", "AUTH");
    }
    if (response.status === 400) {
      const data = await response.json();
      const detail =
        typeof data === "object" && data !== null
          ? data.detail || data.non_field_errors || data
          : data;
      if (typeof detail === "object" && detail.detail) {
        const allergens: string[] = detail.allergens ?? [];
        const msg = detail.detail || "Cantidad no válida.";
        throw new CartError(msg, allergens.length > 0 ? "ALLERGY" : "STOCK", allergens);
      }
      const msg =
        typeof data === "string"
          ? data
          : Object.values(data)
              .flat()
              .join(" ");
      throw new CartError(msg || "Cantidad no válida.", "STOCK");
    }
    if (!response.ok) throw new CartError("Error al agregar al carrito.", "UNKNOWN");
    return response.json();
  } catch (err) {
    if (err instanceof CartError) throw err;
    throw new CartError("Error de conexión. Intenta de nuevo.", "NETWORK");
  }
}

export async function updateCartItemQuantity(
  id: string,
  quantity: number,
): Promise<CartItem> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/cart/items/${id}/`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok)
      throw new CartError("Error al actualizar el carrito.", "UNKNOWN");
    return response.json();
  } catch (err) {
    if (err instanceof CartError) throw err;
    throw new CartError("Error de conexión. Intenta de nuevo.", "NETWORK");
  }
}

export async function removeCartItem(id: string): Promise<void> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/cart/items/${id}/`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (!response.ok)
      throw new CartError("Error al eliminar del carrito.", "UNKNOWN");
  } catch (err) {
    if (err instanceof CartError) throw err;
    throw new CartError("Error de conexión. Intenta de nuevo.", "NETWORK");
  }
}

export async function clearCart(): Promise<{
  message: string;
  deleted_items: number;
}> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/cart/items/clear/`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (!response.ok)
      throw new CartError("Error al vaciar el carrito.", "UNKNOWN");
    return response.json();
  } catch (err) {
    if (err instanceof CartError) throw err;
    throw new CartError("Error de conexión. Intenta de nuevo.", "NETWORK");
  }
}

export interface CheckoutResponse {
  id: string;
  status: string;
  delivery_address: string;
  subtotal: string;
  tax: string;
  total: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: string;
    subtotal: string;
  }>;
  created_at: string;
}

export async function checkout(): Promise<CheckoutResponse> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/cart/items/checkout/`, {
      method: "POST",
      headers: await authHeaders(),
    });
    if (response.status === 401 || response.status === 403) {
      throw new CartError("Debes iniciar sesión como comprador.", "AUTH");
    }
    if (response.status === 400) {
      const data = await response.json();
      const msg =
        typeof data === "string"
          ? data
          : data.detail || "Error al confirmar el pedido.";
      throw new CartError(msg, "UNKNOWN");
    }
    if (!response.ok)
      throw new CartError("Error al confirmar el pedido.", "UNKNOWN");
    return response.json();
  } catch (err) {
    if (err instanceof CartError) throw err;
    throw new CartError("Error de conexión. Intenta de nuevo.", "NETWORK");
  }
}

export async function getCartCount(): Promise<number> {
  try {
    const data = await getCartItems();
    return data.total_items;
  } catch {
    return 0;
  }
}
