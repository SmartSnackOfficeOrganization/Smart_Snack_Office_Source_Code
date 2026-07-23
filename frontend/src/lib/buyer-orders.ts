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

export interface BuyerOrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface BuyerOrder {
  id: string;
  buyer_name: string;
  buyer_company: string | null;
  status: string;
  delivery_address: string;
  subtotal: string;
  tax: string;
  total: string;
  transaction_id: string | null;
  items: BuyerOrderItem[];
  created_at: string;
}

export async function getMyOrders(status?: string): Promise<BuyerOrder[]> {
  const token = getAccessToken();
  if (!token) return [];
  const params = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await fetch(
    `${getBaseUrl()}/api/auth/my-orders/${params}`,
    { headers: await authHeaders() },
  );
  if (!response.ok) throw new Error("Error al cargar pedidos.");
  return response.json();
}

export async function downloadReceipt(orderId: string): Promise<void> {
  const token = getAccessToken();
  if (!token) throw new Error("No autenticado.");
  const response = await fetch(
    `${getBaseUrl()}/api/auth/my-orders/${orderId}/receipt/`,
    { headers: await authHeaders() },
  );
  if (!response.ok) throw new Error("Error al descargar comprobante.");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `comprobante_${orderId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
