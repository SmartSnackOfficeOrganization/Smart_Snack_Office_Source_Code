import { register } from "@/lib/auth/registration";
import { RegistrationFormData } from "@/lib/validation";

const mockBuyerData: RegistrationFormData = {
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

const mockSellerData: RegistrationFormData = {
  ...mockBuyerData,
  role: "seller",
  businessName: "Snacks Andinos",
  companyName: "",
  deliveryAddress: "",
};

describe("register", () => {
  it("returns success for buyer in mock mode", async () => {
    const result = await register(mockBuyerData);
    expect(result.success).toBe(true);
  });

  it("returns success for seller in mock mode", async () => {
    const result = await register(mockSellerData);
    expect(result.success).toBe(true);
  });

  it("does not return field errors on success", async () => {
    const result = await register(mockBuyerData);
    expect(result.fieldErrors).toBeUndefined();
  });
});
