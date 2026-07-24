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

export interface ReviewData {
  id: string;
  buyer: string;
  buyer_name: string;
  product: string;
  order: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export class ReviewError extends Error {
  constructor(
    message: string,
    public code: "NETWORK" | "DELIVERY_REQUIRED" | "ALREADY_REVIEWED" | "UNKNOWN",
  ) {
    super(message);
    this.name = "ReviewError";
  }
}

export async function getReviews(productId: string): Promise<ReviewData[]> {
  let response: Response;
  try {
    response = await fetch(
      `${getBaseUrl()}/api/catalog/products/${productId}/reviews/`,
    );
  } catch {
    throw new ReviewError("Error de conexión.", "NETWORK");
  }
  if (!response.ok) throw new ReviewError("Error al cargar reseñas.", "UNKNOWN");
  const data = await response.json();
  return data.results ?? data;
}

export async function createReview(
  productId: string,
  rating: number,
  comment?: string,
): Promise<ReviewData> {
  let response: Response;
  try {
    response = await fetch(
      `${getBaseUrl()}/api/catalog/products/${productId}/reviews/`,
      {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ rating, comment: comment ?? "" }),
      },
    );
  } catch {
    throw new ReviewError("Error de conexión.", "NETWORK");
  }

  if (response.status === 400) {
    const data = await response.json();
    const detail =
      typeof data.detail === "string"
        ? data.detail
        : typeof data === "string"
          ? data
          : JSON.stringify(data);
    if (detail.includes("orden entregada")) {
      throw new ReviewError(detail, "DELIVERY_REQUIRED");
    }
    if (detail.includes("Ya has calificado")) {
      throw new ReviewError(detail, "ALREADY_REVIEWED");
    }
    throw new ReviewError(detail, "UNKNOWN");
  }

  if (!response.ok) throw new ReviewError("Error al crear reseña.", "UNKNOWN");
  return response.json();
}

export async function updateReview(
  productId: string,
  reviewId: string,
  rating: number,
  comment?: string,
): Promise<ReviewData> {
  let response: Response;
  try {
    response = await fetch(
      `${getBaseUrl()}/api/catalog/products/${productId}/reviews/${reviewId}/`,
      {
        method: "PATCH",
        headers: await authHeaders(),
        body: JSON.stringify({ rating, comment: comment ?? "" }),
      },
    );
  } catch {
    throw new ReviewError("Error de conexión.", "NETWORK");
  }
  if (!response.ok) throw new ReviewError("Error al actualizar reseña.", "UNKNOWN");
  return response.json();
}

export async function deleteReview(
  productId: string,
  reviewId: string,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(
      `${getBaseUrl()}/api/catalog/products/${productId}/reviews/${reviewId}/`,
      {
        method: "DELETE",
        headers: await authHeaders(),
      },
    );
  } catch {
    throw new ReviewError("Error de conexión.", "NETWORK");
  }
  if (!response.ok) throw new ReviewError("Error al eliminar reseña.", "UNKNOWN");
}
