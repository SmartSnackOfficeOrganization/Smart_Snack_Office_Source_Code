export interface NutritionFactsData {
  calories?: number | null;
  protein_g?: number | null;
  fat_g?: number | null;
  carbs_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
  serving_size?: string | null;
}

export interface CreateProductData {
  name: string;
  description?: string;
  ingredients?: string;
  price: number;
  stock: number;
  category_id?: string;
  tags?: string[];
  nutrition_facts?: NutritionFactsData;
}

export type UpdateProductData = Partial<CreateProductData>;

export interface SellerProduct {
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
  nutrition_facts: NutritionFactsData | null;
  created_at: string;
  updated_at: string;
}

export interface SellerProductListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SellerProduct[];
}
