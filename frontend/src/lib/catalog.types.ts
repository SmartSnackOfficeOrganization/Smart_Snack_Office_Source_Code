export interface Product {
  id: string;
  name: string;
  description: string | null;
  ingredients: string | null;
  price: string;
  stock: number;
  status: string;
  avg_rating: string;
  review_count: number;
  is_featured: boolean;
  category: string | null;
  relevance_score: number | null;
  match_stage: "literal" | "tfidf" | null;
  is_compatible: boolean | null;
}

export interface SearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}
