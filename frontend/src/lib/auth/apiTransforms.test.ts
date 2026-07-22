import {
  mapRegistrationToApi,
  mapApiErrorsToForm,
  getRegistrationEndpoint,
} from "@/lib/auth/apiTransforms";
import { RegistrationFormData } from "@/lib/validation";

describe("mapRegistrationToApi", () => {
  const baseBuyerData: RegistrationFormData = {
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

  const baseSellerData: RegistrationFormData = {
    ...baseBuyerData,
    role: "seller",
    businessName: "Snacks Andinos",
    companyName: "",
    deliveryAddress: "",
  };

  it("maps buyer fields correctly", () => {
    const result = mapRegistrationToApi(baseBuyerData);
    expect(result).toEqual({
      email: "maria@empresa.com",
      full_name: "María González",
      password: "ContraseñaSegura123!",
      confirm_password: "ContraseñaSegura123!",
      terms_accepted: true,
      delivery_address: "Calle 123",
      company_name: "TechCorp",
    });
  });

  it("maps seller fields correctly", () => {
    const result = mapRegistrationToApi(baseSellerData);
    expect(result).toEqual({
      email: "maria@empresa.com",
      full_name: "María González",
      business_name: "Snacks Andinos",
      password: "ContraseñaSegura123!",
      confirm_password: "ContraseñaSegura123!",
      terms_accepted: true,
    });
  });

  it("trims and lowercases email", () => {
    const result = mapRegistrationToApi({
      ...baseBuyerData,
      email: "  MARIA@EMPRESA.COM  ",
    });
    expect(result.email).toBe("maria@empresa.com");
  });

  it("trims full name", () => {
    const result = mapRegistrationToApi({
      ...baseBuyerData,
      fullName: "  María González  ",
    });
    expect(result.full_name).toBe("María González");
  });

  it("sets optional buyer fields to undefined when empty", () => {
    const result = mapRegistrationToApi({
      ...baseBuyerData,
      companyName: "",
      deliveryAddress: "",
    });
    expect(result.company_name).toBeUndefined();
    expect(result.delivery_address).toBeUndefined();
  });
});

describe("mapApiErrorsToForm", () => {
  it("maps email errors", () => {
    const errors = mapApiErrorsToForm({ email: ["Email is already in use"] });
    expect(errors.email).toBe("Email is already in use");
  });

  it("maps full_name errors to fullName", () => {
    const errors = mapApiErrorsToForm({ full_name: ["Name is required"] });
    expect(errors.fullName).toBe("Name is required");
  });

  it("maps non_field_errors to email field", () => {
    const errors = mapApiErrorsToForm({
      non_field_errors: ["Invalid credentials"],
    });
    expect(errors.email).toBe("Invalid credentials");
  });

  it("takes first error message when multiple", () => {
    const errors = mapApiErrorsToForm({
      password: ["Too short", "Needs uppercase"],
    });
    expect(errors.password).toBe("Too short");
  });

  it("returns empty object for empty errors", () => {
    const errors = mapApiErrorsToForm({});
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

describe("getRegistrationEndpoint", () => {
  it("returns buyer endpoint", () => {
    const url = getRegistrationEndpoint("buyer");
    expect(url).toContain("/api/auth/register/buyer/");
  });

  it("returns seller endpoint", () => {
    const url = getRegistrationEndpoint("seller");
    expect(url).toContain("/api/auth/register/seller/");
  });

  it("uses NEXT_PUBLIC_API_URL", () => {
    const url = getRegistrationEndpoint("buyer");
    expect(url).toMatch(/^http:\/\/localhost:8000/);
  });
});
