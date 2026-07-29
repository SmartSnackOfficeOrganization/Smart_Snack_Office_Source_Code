import { CatalogProduct } from "./catalog-browse.types";
import { getAccessToken } from "@/lib/auth/session";

export class RecommendationsError extends Error {
  constructor(
    message: string,
    public code: "NETWORK" | "AUTH" | "INELIGIBLE" | "UNKNOWN",
  ) {
    super(message);
    this.name = "RecommendationsError";
  }
}

export type RecommendationReasonCode =
  | "because_purchased"
  | "similar_buyers"
  | "popularity"
  | string;

export interface RecommendedProduct extends CatalogProduct {
  affinity_score: number | null;
  source: "item_cf" | "popularity" | string | null;
  reason_code: RecommendationReasonCode | null;
  reason: string | null;
}

export interface RecommendationsResponse {
  eligible: boolean;
  reason: string | null;
  count: number;
  results: RecommendedProduct[];
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

export async function getRecommendations(
  limit = 5,
): Promise<RecommendationsResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new RecommendationsError("No autenticado.", "AUTH");
  }

  let response: Response;
  try {
    response = await fetch(
      `${getBaseUrl()}/api/catalog/recommendations/?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
  } catch {
    throw new RecommendationsError(
      "Error de conexión. Intenta de nuevo.",
      "NETWORK",
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new RecommendationsError("No autenticado.", "AUTH");
  }

  if (!response.ok) {
    throw new RecommendationsError(
      "Error al cargar recomendaciones.",
      "UNKNOWN",
    );
  }

  const data = (await response.json()) as RecommendationsResponse;
  if (!data.eligible) {
    throw new RecommendationsError(
      data.reason ?? "Sin historial suficiente para recomendar.",
      "INELIGIBLE",
    );
  }

  return data;
}
