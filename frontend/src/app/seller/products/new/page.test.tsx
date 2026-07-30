import NewProductPage from "@/app/seller/products/new/page";

describe("NewProductPage", () => {
  it("is a valid React component", () => {
    expect(typeof NewProductPage).toBe("function");
  });

  it("has a display name", () => {
    expect(NewProductPage.name).toBe("NewProductPage");
  });
});
