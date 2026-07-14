import RegisterPage from "@/app/register/page";

describe("RegisterPage", () => {
  it("is a valid React component", () => {
    expect(typeof RegisterPage).toBe("function");
  });

  it("has a display name", () => {
    expect(RegisterPage.name).toBe("RegisterPage");
  });
});
