import HomePage from "@/app/page";

describe("HomePage", () => {
  it("is a valid React component", () => {
    expect(typeof HomePage).toBe("function");
  });

  it("has a display name", () => {
    expect(HomePage.name).toBe("HomePage");
  });
});
