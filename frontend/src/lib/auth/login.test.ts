import { login, getDashboardPath, MOCK_USERS, GENERIC_LOGIN_ERROR } from "@/lib/auth/login";
import { AUTH_STORAGE_KEY } from "@/lib/auth/constants";
import { AuthError } from "@/lib/auth/types";

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  localStorage.clear();
});

describe("login", () => {
  it("returns session with valid buyer credentials", async () => {
    const credentials = { email: "comprador@empresa.com", password: "ContraseñaSegura123!" };
    const promise = login(credentials);
    jest.advanceTimersByTime(800);
    const session = await promise;

    expect(session.role).toBe("buyer");
    expect(session.email).toBe("comprador@empresa.com");
    expect(session.access).toContain("mock.access.");
    expect(session.refresh).toContain("mock.refresh.");
  });

  it("returns session with valid seller credentials", async () => {
    const credentials = { email: "vendedor@empresa.com", password: "ContraseñaSegura123!" };
    const promise = login(credentials);
    jest.advanceTimersByTime(800);
    const session = await promise;

    expect(session.role).toBe("seller");
    expect(session.email).toBe("vendedor@empresa.com");
  });

  it("throws AuthError with invalid credentials", async () => {
    const credentials = { email: "wrong@empresa.com", password: "wrong" };
    const promise = login(credentials);
    jest.advanceTimersByTime(800);

    await expect(promise).rejects.toThrow(AuthError);
    await expect(promise).rejects.toThrow(GENERIC_LOGIN_ERROR);
  });

  it("saves session to localStorage after successful login", async () => {
    const credentials = { email: "comprador@empresa.com", password: "ContraseñaSegura123!" };
    const promise = login(credentials);
    jest.advanceTimersByTime(800);
    await promise;

    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.role).toBe("buyer");
  });

  it("normalizes email to lowercase and trims", async () => {
    const credentials = {
      email: "  Comprador@Empresa.COM  ",
      password: "ContraseñaSegura123!",
    };
    const promise = login(credentials);
    jest.advanceTimersByTime(800);
    const session = await promise;

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

describe("MOCK_USERS", () => {
  it("contains 2 test users", () => {
    expect(MOCK_USERS).toHaveLength(2);
  });

  it("has a buyer and a seller", () => {
    const roles = MOCK_USERS.map((u) => u.role);
    expect(roles).toContain("buyer");
    expect(roles).toContain("seller");
  });
});

describe("GENERIC_LOGIN_ERROR", () => {
  it("has correct message", () => {
    expect(GENERIC_LOGIN_ERROR).toBe("Correo o contraseña incorrectos");
  });
});
