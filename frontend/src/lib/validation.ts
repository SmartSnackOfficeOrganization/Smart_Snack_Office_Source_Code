export type UserRole = "buyer" | "seller";

export interface RegistrationFormData {
  role: UserRole;
  fullName: string;
  businessName: string;
  companyName: string;
  deliveryAddress: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
}

export interface PasswordCriteria {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
}

export interface RegistrationFormErrors {
  role?: string;
  fullName?: string;
  businessName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  termsAccepted?: string;
}

export interface ForgotPasswordFormErrors {
  email?: string;
}

export interface ResetPasswordFormErrors {
  newPassword?: string;
  confirmPassword?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function evaluatePasswordCriteria(password: string): PasswordCriteria {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /[0-9]/.test(password),
  };
}

export function isPasswordValid(criteria: PasswordCriteria): boolean {
  return (
    criteria.minLength &&
    criteria.hasUppercase &&
    criteria.hasLowercase &&
    criteria.hasDigit
  );
}

export function validateRegistrationForm(
  data: RegistrationFormData,
): RegistrationFormErrors {
  const errors: RegistrationFormErrors = {};

  if (!data.fullName.trim()) {
    errors.fullName = "El nombre es obligatorio.";
  } else if (data.fullName.trim().length < 2) {
    errors.fullName = "El nombre debe tener al menos 2 caracteres.";
  }

  if (data.role === "seller" && !data.businessName.trim()) {
    errors.businessName = "El nombre del negocio es obligatorio para vendedores.";
  }

  if (!data.email.trim()) {
    errors.email = "El correo electrónico es obligatorio.";
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.email = "Ingresa un correo electrónico válido (ej. usuario@empresa.com).";
  }

  const passwordCriteria = evaluatePasswordCriteria(data.password);
  if (!data.password) {
    errors.password = "La contraseña es obligatoria.";
  } else if (!isPasswordValid(passwordCriteria)) {
    errors.password = "La contraseña no cumple los criterios de seguridad.";
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = "Confirma tu contraseña.";
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }

  if (!data.termsAccepted) {
    errors.termsAccepted = "Debes aceptar los términos y condiciones.";
  }

  return errors;
}

export function validateLoginForm(data: LoginFormData): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!data.email.trim()) {
    errors.email = "El correo electrónico es obligatorio.";
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.email = "Ingresa un correo electrónico válido (ej. usuario@empresa.com).";
  }

  if (!data.password) {
    errors.password = "La contraseña es obligatoria.";
  }

  return errors;
}

export const PASSWORD_CRITERIA_LABELS: {
  key: keyof PasswordCriteria;
  label: string;
}[] = [
  { key: "minLength", label: "Mínimo 8 caracteres" },
  { key: "hasUppercase", label: "Al menos una mayúscula" },
  { key: "hasLowercase", label: "Al menos una minúscula" },
  { key: "hasDigit", label: "Al menos un número" },
];

export function validateForgotPasswordForm(
  data: ForgotPasswordFormData,
): ForgotPasswordFormErrors {
  const errors: ForgotPasswordFormErrors = {};

  if (!data.email.trim()) {
    errors.email = "El correo electrónico es obligatorio.";
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.email = "Ingresa un correo electrónico válido (ej. usuario@empresa.com).";
  }

  return errors;
}

export function validateResetPasswordForm(
  data: ResetPasswordFormData,
): ResetPasswordFormErrors {
  const errors: ResetPasswordFormErrors = {};

  const passwordCriteria = evaluatePasswordCriteria(data.newPassword);
  if (!data.newPassword) {
    errors.newPassword = "La contraseña es obligatoria.";
  } else if (!isPasswordValid(passwordCriteria)) {
    errors.newPassword = "La contraseña no cumple los criterios de seguridad.";
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = "Confirma tu contraseña.";
  } else if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }

  return errors;
}
