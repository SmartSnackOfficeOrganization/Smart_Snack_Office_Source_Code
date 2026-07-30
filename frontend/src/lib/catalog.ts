import { SearchResponse } from "@/lib/catalog.types";

export class CatalogError extends Error {
  constructor(
    message: string,
    public code: string = "CATALOG_ERROR",
  ) {
    super(message);
    this.name = "CatalogError";
  }
}

export async function searchProducts(
  query: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<SearchResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const params = new URLSearchParams({
    q: query.trim(),
    page: String(page),
    page_size: String(pageSize),
  });

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/catalog/search/?${params}`);
  } catch {
    throw new CatalogError("Error de conexión. Intenta de nuevo.", "NETWORK");
  }

  if (!response.ok) {
    throw new CatalogError(
      "Error al buscar productos. Intenta de nuevo.",
      "SEARCH_FAILED",
    );
  }

  return response.json();
}
