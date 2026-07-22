import { CatalogFilters, CatalogResponse, CategoryItem, TagItem } from "./catalog-browse.types";

export class CatalogBrowseError extends Error {
  constructor(
    message: string,
    public code: "NETWORK" | "UNKNOWN",
  ) {
    super(message);
    this.name = "CatalogBrowseError";
  }
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

export async function getCategories(): Promise<CategoryItem[]> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/api/catalog/categories/`);
  } catch {
    throw new CatalogBrowseError("Error de conexión. Intenta de nuevo.", "NETWORK");
  }
  if (!response.ok) {
    throw new CatalogBrowseError("Error al cargar categorías.", "UNKNOWN");
  }
  return response.json();
}

export async function getTags(): Promise<TagItem[]> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/api/catalog/tags/`);
  } catch {
    throw new CatalogBrowseError("Error de conexión. Intenta de nuevo.", "NETWORK");
  }
  if (!response.ok) {
    throw new CatalogBrowseError("Error al cargar etiquetas.", "UNKNOWN");
  }
  return response.json();
}

export async function getCatalogProducts(
  filters: CatalogFilters = {},
): Promise<CatalogResponse> {
  const params = new URLSearchParams();

  if (filters.category) params.set("category", filters.category);
  if (filters.tags) params.set("tags", filters.tags);
  if (filters.price_min != null) params.set("price_min", String(filters.price_min));
  if (filters.price_max != null) params.set("price_max", String(filters.price_max));
  if (filters.in_stock != null) params.set("in_stock", String(filters.in_stock));
  if (filters.ordering) params.set("ordering", filters.ordering);
  if (filters.page != null) params.set("page", String(filters.page));
  if (filters.page_size != null) params.set("page_size", String(filters.page_size));

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/api/catalog/products/?${params}`);
  } catch {
    throw new CatalogBrowseError("Error de conexión. Intenta de nuevo.", "NETWORK");
  }

  if (!response.ok) {
    throw new CatalogBrowseError("Error al cargar productos.", "UNKNOWN");
  }

  return response.json();
}
