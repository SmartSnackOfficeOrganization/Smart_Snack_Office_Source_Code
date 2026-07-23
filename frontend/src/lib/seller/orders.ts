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

export interface OrderItemData {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface OrderData {
  id: string;
  buyer_name: string;
  buyer_company: string | null;
  buyer_address: string | null;
  status: string;
  delivery_address: string;
  subtotal: string;
  tax: string;
  total: string;
  items: OrderItemData[];
  created_at: string;
  updated_at: string;
}

export async function getSellerOrders(status?: string): Promise<OrderData[]> {
  const token = getAccessToken();
  if (!token) return [];
  const params = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await fetch(
    `${getBaseUrl()}/api/auth/orders/${params}`,
    { headers: await authHeaders() },
  );
  if (!response.ok) throw new Error("Error al cargar pedidos.");
  return response.json();
}

export async function downloadShippingLabels(orderIds: string[]): Promise<void> {
  const token = getAccessToken();
  if (!token) throw new Error("No autenticado.");
  const params = orderIds.map((id) => `order_ids=${encodeURIComponent(id)}`).join("&");
  const response = await fetch(
    `${getBaseUrl()}/api/auth/orders/shipping-labels/?${params}`,
    { headers: await authHeaders() },
  );
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail || "Error al generar etiquetas.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "etiquetas_envio.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
