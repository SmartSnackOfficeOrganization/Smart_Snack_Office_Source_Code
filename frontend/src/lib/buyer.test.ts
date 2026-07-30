/**
 * @jest-environment node
 */

import { getProductById, BuyerProductError } from "@/lib/buyer";

const API_URL = "http://localhost:8000";

const mockProduct = {
  id: "prod-1",
  name: "Chocolate amargo",
  description: "Barra de chocolate 70% cacao",
  ingredients: "cacao, azúcar, manteca de cacao",
  price: "5.00",
  stock: 10,
  status: "active",
  avg_rating: "4.50",
  review_count: 12,
  is_featured: true,
  category: { id: "cat-1", name: "Dulces", description: null },
  tags: ["chocolate", "vegano"],
  nutrition_facts: {
    calories: 120,
    protein_g: 3,
    fat_g: 8,
    carbs_g: 15,
    sugar_g: 10,
    sodium_mg: 5,
    serving_size: "30g",
  },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

beforeEach(() => {
  jest.restoreAllMocks();
});

describe("getProductById", () => {
  it("returns product data on success", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockProduct,
    });
    global.fetch = mockFetch;

    const result = await getProductById("prod-1");
    expect(result).toEqual(mockProduct);
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/api/catalog/products/prod-1/`,
    );
  });

  it("throws NETWORK error on fetch failure", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    await expect(getProductById("prod-1")).rejects.toThrow(BuyerProductError);
    await expect(getProductById("prod-1")).rejects.toMatchObject({
      code: "NETWORK",
    });
  });

  it("throws NOT_FOUND on 404", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(getProductById("prod-1")).rejects.toThrow(BuyerProductError);
    await expect(getProductById("prod-1")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("throws UNKNOWN on server error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(getProductById("prod-1")).rejects.toThrow(BuyerProductError);
    await expect(getProductById("prod-1")).rejects.toMatchObject({
      code: "UNKNOWN",
    });
  });
});
