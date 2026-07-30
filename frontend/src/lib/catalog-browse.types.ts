export interface CategoryItem {
  id: string;
  name: string;
  description: string | null;
}

export interface TagItem {
  id: string;
  name: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  price: string;
  stock: number;
  status: string;
  avg_rating: string;
  review_count: number;
  is_featured: boolean;
  category: CategoryItem | null;
  tags: string[];
}

export interface CatalogResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CatalogProduct[];
}

export interface CatalogFilters {
  category?: string;
  tags?: string;
  price_min?: number;
  price_max?: number;
  in_stock?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}
