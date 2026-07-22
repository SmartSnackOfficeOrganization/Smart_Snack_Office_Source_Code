import { register } from "@/lib/auth/registration";
import { RegistrationFormData } from "@/lib/validation";
import { AuthError } from "@/lib/auth/types";

const mockFetch = jest.fn();
global.fetch = mockFetch;

const buyerData: RegistrationFormData = {
  role: "buyer",
  fullName: "María González",
  businessName: "",
  companyName: "TechCorp",
  deliveryAddress: "Calle 123",
  email: "maria@empresa.com",
  password: "ContraseñaSegura123!",
  confirmPassword: "ContraseñaSegura123!",
  termsAccepted: true,
};

const sellerData: RegistrationFormData = {
  ...buyerData,
  role: "seller",
  businessName: "Snacks Andinos",
  companyName: "",
  deliveryAddress: "",
};

beforeEach(() => {
  mockFetch.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

function mockRegisterSuccess() {
  mockFetch.mockResolvedValue({
    ok: true,
    status: 201,
    json: () => Promise.resolve({ message: "Account created", activation_url: "/activate/abc123/token456" }),
  });
}

function mockRegisterFailure(errors: Record<string, string[]>) {
  mockFetch.mockResolvedValue({
    ok: false,
    status: 400,
    json: () => Promise.resolve(errors),
  });
}

describe("register", () => {
  it("returns success for buyer registration", async () => {
    mockRegisterSuccess();
    const result = await register(buyerData);
    expect(result.success).toBe(true);
    expect(result.activationUrl).toBe("/activate/abc123/token456");
  });

  it("returns success for seller registration", async () => {
    mockRegisterSuccess();
    const result = await register(sellerData);
    expect(result.success).toBe(true);
  });

  it("returns field errors on 400 response", async () => {
    mockRegisterFailure({ email: ["Este correo ya está registrado."] });
    const result = await register(buyerData);
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.email).toBe("Este correo ya está registrado.");
  });

  it("throws AuthError on network failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    await expect(register(buyerData)).rejects.toThrow(AuthError);
  });
});
