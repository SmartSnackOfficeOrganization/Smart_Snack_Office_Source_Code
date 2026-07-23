import EditProductPage from "@/app/seller/products/[id]/edit/page";

describe("EditProductPage", () => {
  it("is a valid React component", () => {
    expect(typeof EditProductPage).toBe("function");
  });

  it("has a display name", () => {
    expect(EditProductPage.name).toBe("EditProductPage");
  });
});
