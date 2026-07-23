import { listMyProducts, createProduct, updateProduct, deleteProduct, SellerCatalogError } from "@/lib/seller/catalog";

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
});

jest.mock("@/lib/auth/session", () => ({
  getValidAccessToken: jest.fn().mockResolvedValue("real.access.token"),
}));

jest.mock("@/lib/auth/types", () => ({
  AuthError: class AuthError extends Error {
    constructor(code: string, message: string) {
      super(message);
      this.name = "AuthError";
    }
  },
}));

function mockSuccess(status: number, body: unknown) {
  mockFetch.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

function mockFailure(status: number, body: unknown) {
  mockFetch.mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  });
}

describe("listMyProducts", () => {
  it("returns product list on success", async () => {
    mockSuccess(200, { count: 1, next: null, previous: null, results: [] });
    const result = await listMyProducts();
    expect(result.count).toBe(1);
    expect(result.results).toEqual([]);
  });

  it("throws SellerCatalogError on failure", async () => {
    mockFailure(500, { detail: "Server error" });
    await expect(listMyProducts()).rejects.toThrow(SellerCatalogError);
  });
});

describe("createProduct", () => {
  it("returns created product on success", async () => {
    const product = { id: "1", name: "Test Product" };
    mockSuccess(201, product);
    const result = await createProduct({ name: "Test Product", price: 5.99, stock: 10 });
    expect(result.name).toBe("Test Product");
  });

  it("throws SellerCatalogError with validation message on 400", async () => {
    mockFailure(400, { name: ["Este campo es obligatorio."] });
    await expect(createProduct({ name: "", price: 0, stock: 0 })).rejects.toThrow(SellerCatalogError);
  });
});

describe("updateProduct", () => {
  it("returns updated product on success", async () => {
    const product = { id: "1", name: "Updated Product" };
    mockSuccess(200, product);
    const result = await updateProduct("1", { name: "Updated Product" });
    expect(result.name).toBe("Updated Product");
  });

  it("throws SellerCatalogError on 404", async () => {
    mockFailure(404, { detail: "Not found" });
    await expect(updateProduct("999", { name: "Test" })).rejects.toThrow(SellerCatalogError);
  });
});

describe("deleteProduct", () => {
  it("resolves on success", async () => {
    mockSuccess(204, null);
    await expect(deleteProduct("1")).resolves.toBeUndefined();
  });

  it("throws SellerCatalogError on 403", async () => {
    mockFailure(403, { detail: "Forbidden" });
    await expect(deleteProduct("1")).rejects.toThrow(SellerCatalogError);
  });
});
