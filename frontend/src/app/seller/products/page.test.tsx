import SellerProductsPage from "@/app/seller/products/page";

describe("SellerProductsPage", () => {
  it("is a valid React component", () => {
    expect(typeof SellerProductsPage).toBe("function");
  });

  it("has a display name", () => {
    expect(SellerProductsPage.name).toBe("SellerProductsPage");
  });
});
