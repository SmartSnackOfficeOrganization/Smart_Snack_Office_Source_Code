export interface CartProduct {
  id: string;
  name: string;
  price: string;
  stock: number;
  status: string;
}

export interface CartItem {
  id: string;
  product: CartProduct;
  quantity: number;
}

export interface CartListResponse {
  items: CartItem[];
  total_items: number;
}
