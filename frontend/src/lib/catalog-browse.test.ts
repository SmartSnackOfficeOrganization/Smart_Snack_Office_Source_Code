/**
 * @jest-environment node
 */

import { getCategories, getTags, getCatalogProducts, CatalogBrowseError } from "./catalog-browse";

const API_URL = "http://localhost:8000";

const mockCategories = [
  { id: "cat-1", name: "Snacks", description: null },
  { id: "cat-2", name: "Bebidas", description: "Bebidas saludables" },
];

const mockTags = [
  { id: "tag-1", name: "chocolate" },
  { id: "tag-2", name: "vegano" },
];

const mockProducts = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: "prod-1",
      name: "Chocolate amargo",
      description: "Barra de chocolate 70% cacao",
      price: "5.00",
      stock: 10,
      status: "active",
      avg_rating: "4.50",
      review_count: 12,
      is_featured: true,
      category: { id: "cat-1", name: "Snacks", description: null },
      tags: ["chocolate", "vegano"],
    },
  ],
};

beforeEach(() => {
  jest.restoreAllMocks();
});

describe("getCategories", () => {
  it("returns category list on success", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCategories,
    });
    global.fetch = mockFetch;

    const result = await getCategories();
    expect(result).toEqual(mockCategories);
    expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/api/catalog/categories/`);
  });

  it("throws NETWORK error on fetch failure", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    await expect(getCategories()).rejects.toThrow(CatalogBrowseError);
  });

  it("throws UNKNOWN on server error", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(getCategories()).rejects.toMatchObject({ code: "UNKNOWN" });
  });
});

describe("getTags", () => {
  it("returns tag list on success", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTags,
    });

    const result = await getTags();
    expect(result).toEqual(mockTags);
  });

  it("throws NETWORK error on fetch failure", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    await expect(getTags()).rejects.toThrow(CatalogBrowseError);
  });
});

describe("getCatalogProducts", () => {
  it("returns paginated products without filters", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockProducts,
    });

    const result = await getCatalogProducts();
    expect(result).toEqual(mockProducts);
    expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/api/catalog/products/?`);
  });

  it("passes filter params correctly", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockProducts,
    });

    await getCatalogProducts({
      category: "cat-1",
      tags: "chocolate,vegano",
      price_min: 1,
      price_max: 10,
      in_stock: true,
      ordering: "-price",
      page: 2,
    });

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain("category=cat-1");
    expect(url).toContain("tags=chocolate%2Cvegano");
    expect(url).toContain("price_min=1");
    expect(url).toContain("price_max=10");
    expect(url).toContain("in_stock=true");
    expect(url).toContain("ordering=-price");
    expect(url).toContain("page=2");
  });

  it("throws NETWORK on fetch failure", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    await expect(getCatalogProducts()).rejects.toMatchObject({ code: "NETWORK" });
  });

  it("throws UNKNOWN on server error", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(getCatalogProducts()).rejects.toMatchObject({ code: "UNKNOWN" });
  });
});
