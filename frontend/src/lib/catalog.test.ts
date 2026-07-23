import { searchProducts, CatalogError } from "@/lib/catalog";

const mockSearchResponse = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: "1",
      name: "Chocolate amargo",
      description: "Barra de chocolate",
      ingredients: "cacao",
      price: "5.00",
      stock: 10,
      status: "active",
      avg_rating: "4.50",
      review_count: 12,
      is_featured: false,
      category: "Dulces",
      relevance_score: null,
      match_stage: "literal",
      is_compatible: null,
    },
  ],
};

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("searchProducts", () => {
  it("calls the search API with correct params", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResponse),
    });

    await searchProducts("dulce", 1, 20);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/catalog/search/?q=dulce&page=1&page_size=20"),
    );
  });

  it("returns search results on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResponse),
    });

    const result = await searchProducts("dulce");

    expect(result.count).toBe(2);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].name).toBe("Chocolate amargo");
  });

  it("throws CatalogError on network failure", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    await expect(searchProducts("dulce")).rejects.toThrow(CatalogError);
  });

  it("throws CatalogError on non-ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(searchProducts("dulce")).rejects.toThrow(CatalogError);
  });

  it("encodes special characters in query", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ count: 0, next: null, previous: null, results: [] }),
    });

    await searchProducts("dulce & picante");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("q=dulce+%26+picante"),
    );
  });
});
