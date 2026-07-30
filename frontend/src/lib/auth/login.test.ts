import { login, getDashboardPath, GENERIC_LOGIN_ERROR } from "@/lib/auth/login";
import { AUTH_STORAGE_KEY } from "@/lib/auth/constants";
import { AuthError } from "@/lib/auth/types";

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  localStorage.clear();
  mockFetch.mockClear();
});

afterEach(() => {
  localStorage.clear();
});

function mockLoginSuccess(role: "buyer" | "seller") {
  const payload = btoa(JSON.stringify({ role, exp: Date.now() / 1000 + 3600 }));
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ access: `real.${payload}.token`, refresh: "real.refresh.token" }),
  });
}

function mockLoginFailure(status: number, body: unknown) {
  mockFetch.mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  });
}

describe("login", () => {
  it("returns session with valid buyer credentials", async () => {
    mockLoginSuccess("buyer");
    const credentials = { email: "comprador@empresa.com", password: "ContraseñaSegura123!" };
    const session = await login(credentials);

    expect(session.role).toBe("buyer");
    expect(session.email).toBe("comprador@empresa.com");
    expect(session.access).toContain("real.");
    expect(session.refresh).toBe("real.refresh.token");
  });

  it("returns session with valid seller credentials", async () => {
    mockLoginSuccess("seller");
    const credentials = { email: "vendedor@empresa.com", password: "ContraseñaSegura123!" };
    const session = await login(credentials);

    expect(session.role).toBe("seller");
    expect(session.email).toBe("vendedor@empresa.com");
  });

  it("throws AuthError with invalid credentials", async () => {
    mockLoginFailure(401, { non_field_errors: ["Correo o contraseña incorrectos"] });
    const credentials = { email: "wrong@empresa.com", password: "wrong" };

    await expect(login(credentials)).rejects.toThrow(AuthError);
    await expect(login(credentials)).rejects.toThrow(GENERIC_LOGIN_ERROR);
  });

  it("saves session to localStorage after successful login", async () => {
    mockLoginSuccess("buyer");
    const credentials = { email: "comprador@empresa.com", password: "ContraseñaSegura123!" };
    await login(credentials);

    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.role).toBe("buyer");
  });

  it("normalizes email to lowercase and trims", async () => {
    mockLoginSuccess("buyer");
    const credentials = {
      email: "  Comprador@Empresa.COM  ",
      password: "ContraseñaSegura123!",
    };
    const session = await login(credentials);

    expect(session.email).toBe("comprador@empresa.com");
  });
});

describe("getDashboardPath", () => {
  it("returns /buyer/dashboard for buyer role", () => {
    expect(getDashboardPath("buyer")).toBe("/buyer/dashboard");
  });

  it("returns /seller/dashboard for seller role", () => {
    expect(getDashboardPath("seller")).toBe("/seller/dashboard");
  });
});

describe("GENERIC_LOGIN_ERROR", () => {
  it("has correct message", () => {
    expect(GENERIC_LOGIN_ERROR).toBe("Correo o contraseña incorrectos");
  });
});
