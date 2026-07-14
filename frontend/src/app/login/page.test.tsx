import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  it("is a valid React component", () => {
    expect(typeof LoginPage).toBe("function");
  });

  it("has a display name", () => {
    expect(LoginPage.name).toBe("LoginPage");
  });
});
