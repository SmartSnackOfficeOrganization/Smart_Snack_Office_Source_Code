import { AUTH_STORAGE_KEY, DASHBOARD_ROUTES, LOGIN_ROUTE } from "@/lib/auth/constants";

describe("AUTH_STORAGE_KEY", () => {
  it("has correct value", () => {
    expect(AUTH_STORAGE_KEY).toBe("smartsnack_auth_session");
  });
});

describe("DASHBOARD_ROUTES", () => {
  it("maps buyer to /buyer/dashboard", () => {
    expect(DASHBOARD_ROUTES.buyer).toBe("/buyer/dashboard");
  });

  it("maps seller to /seller/dashboard", () => {
    expect(DASHBOARD_ROUTES.seller).toBe("/seller/dashboard");
  });
});

describe("LOGIN_ROUTE", () => {
  it("is /login", () => {
    expect(LOGIN_ROUTE).toBe("/login");
  });
});
