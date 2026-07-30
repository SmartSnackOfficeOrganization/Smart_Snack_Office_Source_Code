import {
  evaluatePasswordCriteria,
  isPasswordValid,
  validateRegistrationForm,
  validateLoginForm,
  validateForgotPasswordForm,
  validateResetPasswordForm,
  PASSWORD_CRITERIA_LABELS,
  RegistrationFormData,
  LoginFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
} from "@/lib/validation";

describe("evaluatePasswordCriteria", () => {
  it("returns all false for empty string", () => {
    const criteria = evaluatePasswordCriteria("");
    expect(criteria).toEqual({
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasDigit: false,
    });
  });

  it("detects minLength when password is 8+ chars", () => {
    expect(evaluatePasswordCriteria("abcdefgh").minLength).toBe(true);
    expect(evaluatePasswordCriteria("abcdefg").minLength).toBe(false);
  });

  it("detects uppercase letters", () => {
    expect(evaluatePasswordCriteria("ABC").hasUppercase).toBe(true);
    expect(evaluatePasswordCriteria("abc").hasUppercase).toBe(false);
  });

  it("detects lowercase letters", () => {
    expect(evaluatePasswordCriteria("abc").hasLowercase).toBe(true);
    expect(evaluatePasswordCriteria("ABC").hasLowercase).toBe(false);
  });

  it("detects digits", () => {
    expect(evaluatePasswordCriteria("123").hasDigit).toBe(true);
    expect(evaluatePasswordCriteria("abc").hasDigit).toBe(false);
  });

  it("returns all true for a strong password", () => {
    const criteria = evaluatePasswordCriteria("ContraseñaSegura123!");
    expect(criteria).toEqual({
      minLength: true,
      hasUppercase: true,
      hasLowercase: true,
      hasDigit: true,
    });
  });
});

describe("isPasswordValid", () => {
  it("returns true when all criteria are met", () => {
    expect(
      isPasswordValid({
        minLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasDigit: true,
      }),
    ).toBe(true);
  });

  it("returns false when any criteria is not met", () => {
    expect(
      isPasswordValid({
        minLength: false,
        hasUppercase: true,
        hasLowercase: true,
        hasDigit: true,
      }),
    ).toBe(false);
  });

  it("returns false when no criteria is met", () => {
    expect(
      isPasswordValid({
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasDigit: false,
      }),
    ).toBe(false);
  });
});

describe("validateRegistrationForm", () => {
  const validBuyerData: RegistrationFormData = {
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

  const validSellerData: RegistrationFormData = {
    ...validBuyerData,
    role: "seller",
    businessName: "Snacks Andinos",
  };

  it("returns no errors for valid buyer data", () => {
    const errors = validateRegistrationForm(validBuyerData);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("returns no errors for valid seller data", () => {
    const errors = validateRegistrationForm(validSellerData);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("requires fullName", () => {
    const errors = validateRegistrationForm({ ...validBuyerData, fullName: "" });
    expect(errors.fullName).toBe("El nombre es obligatorio.");
  });

  it("requires fullName to have at least 2 characters", () => {
    const errors = validateRegistrationForm({ ...validBuyerData, fullName: "A" });
    expect(errors.fullName).toBe("El nombre debe tener al menos 2 caracteres.");
  });

  it("trims whitespace from fullName before validation", () => {
    const errors = validateRegistrationForm({ ...validBuyerData, fullName: "   " });
    expect(errors.fullName).toBe("El nombre es obligatorio.");
  });

  it("requires businessName for seller role", () => {
    const errors = validateRegistrationForm({
      ...validSellerData,
      businessName: "",
    });
    expect(errors.businessName).toBe(
      "El nombre del negocio es obligatorio para vendedores.",
    );
  });

  it("does not require businessName for buyer role", () => {
    const errors = validateRegistrationForm({
      ...validBuyerData,
      businessName: "",
    });
    expect(errors.businessName).toBeUndefined();
  });

  it("requires email", () => {
    const errors = validateRegistrationForm({ ...validBuyerData, email: "" });
    expect(errors.email).toBe("El correo electrónico es obligatorio.");
  });

  it("validates email format", () => {
    const errors = validateRegistrationForm({
      ...validBuyerData,
      email: "invalido",
    });
    expect(errors.email).toBe(
      "Ingresa un correo electrónico válido (ej. usuario@empresa.com).",
    );
  });

  it("requires password", () => {
    const errors = validateRegistrationForm({ ...validBuyerData, password: "" });
    expect(errors.password).toBe("La contraseña es obligatoria.");
  });

  it("validates password criteria", () => {
    const errors = validateRegistrationForm({
      ...validBuyerData,
      password: "weak",
      confirmPassword: "weak",
    });
    expect(errors.password).toBe(
      "La contraseña no cumple los criterios de seguridad.",
    );
  });

  it("requires confirmPassword", () => {
    const errors = validateRegistrationForm({
      ...validBuyerData,
      confirmPassword: "",
    });
    expect(errors.confirmPassword).toBe("Confirma tu contraseña.");
  });

  it("validates confirmPassword matches password", () => {
    const errors = validateRegistrationForm({
      ...validBuyerData,
      confirmPassword: "DifferentPassword1!",
    });
    expect(errors.confirmPassword).toBe("Las contraseñas no coinciden.");
  });

  it("requires termsAccepted to be true", () => {
    const errors = validateRegistrationForm({
      ...validBuyerData,
      termsAccepted: false,
    });
    expect(errors.termsAccepted).toBe(
      "Debes aceptar los términos y condiciones.",
    );
  });
});

describe("validateLoginForm", () => {
  const validData: LoginFormData = {
    email: "usuario@empresa.com",
    password: "password123",
  };

  it("returns no errors for valid data", () => {
    const errors = validateLoginForm(validData);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("requires email", () => {
    const errors = validateLoginForm({ ...validData, email: "" });
    expect(errors.email).toBe("El correo electrónico es obligatorio.");
  });

  it("validates email format", () => {
    const errors = validateLoginForm({ ...validData, email: "invalido" });
    expect(errors.email).toBe(
      "Ingresa un correo electrónico válido (ej. usuario@empresa.com).",
    );
  });

  it("requires password", () => {
    const errors = validateLoginForm({ ...validData, password: "" });
    expect(errors.password).toBe("La contraseña es obligatoria.");
  });
});

describe("PASSWORD_CRITERIA_LABELS", () => {
  it("contains 4 criteria labels", () => {
    expect(PASSWORD_CRITERIA_LABELS).toHaveLength(4);
  });

  it("each label has a valid key", () => {
    const validKeys = ["minLength", "hasUppercase", "hasLowercase", "hasDigit"];
    PASSWORD_CRITERIA_LABELS.forEach(({ key }) => {
      expect(validKeys).toContain(key);
    });
  });
});

describe("validateForgotPasswordForm", () => {
  const validData: ForgotPasswordFormData = {
    email: "usuario@empresa.com",
  };

  it("returns no errors for valid data", () => {
    const errors = validateForgotPasswordForm(validData);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("requires email", () => {
    const errors = validateForgotPasswordForm({ email: "" });
    expect(errors.email).toBe("El correo electrónico es obligatorio.");
  });

  it("trims whitespace and requires email", () => {
    const errors = validateForgotPasswordForm({ email: "   " });
    expect(errors.email).toBe("El correo electrónico es obligatorio.");
  });

  it("validates email format", () => {
    const errors = validateForgotPasswordForm({ email: "invalido" });
    expect(errors.email).toBe(
      "Ingresa un correo electrónico válido (ej. usuario@empresa.com).",
    );
  });
});

describe("validateResetPasswordForm", () => {
  const validData: ResetPasswordFormData = {
    newPassword: "NewPassword1!",
    confirmPassword: "NewPassword1!",
  };

  it("returns no errors for valid data", () => {
    const errors = validateResetPasswordForm(validData);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("requires newPassword", () => {
    const errors = validateResetPasswordForm({ ...validData, newPassword: "" });
    expect(errors.newPassword).toBe("La contraseña es obligatoria.");
  });

  it("validates password criteria", () => {
    const errors = validateResetPasswordForm({
      ...validData,
      newPassword: "weak",
      confirmPassword: "weak",
    });
    expect(errors.newPassword).toBe(
      "La contraseña no cumple los criterios de seguridad.",
    );
  });

  it("requires confirmPassword", () => {
    const errors = validateResetPasswordForm({
      ...validData,
      confirmPassword: "",
    });
    expect(errors.confirmPassword).toBe("Confirma tu contraseña.");
  });

  it("validates confirmPassword matches newPassword", () => {
    const errors = validateResetPasswordForm({
      ...validData,
      confirmPassword: "DifferentPassword1!",
    });
    expect(errors.confirmPassword).toBe("Las contraseñas no coinciden.");
  });
});
