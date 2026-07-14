import BuyerDashboardPage from "@/app/buyer/dashboard/page";

describe("BuyerDashboardPage", () => {
  it("is a valid React component", () => {
    expect(typeof BuyerDashboardPage).toBe("function");
  });

  it("has a display name", () => {
    expect(BuyerDashboardPage.name).toBe("BuyerDashboardPage");
  });
});
