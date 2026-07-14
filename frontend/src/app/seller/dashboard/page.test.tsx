import SellerDashboardPage from "@/app/seller/dashboard/page";

describe("SellerDashboardPage", () => {
  it("is a valid React component", () => {
    expect(typeof SellerDashboardPage).toBe("function");
  });

  it("has a display name", () => {
    expect(SellerDashboardPage.name).toBe("SellerDashboardPage");
  });
});
