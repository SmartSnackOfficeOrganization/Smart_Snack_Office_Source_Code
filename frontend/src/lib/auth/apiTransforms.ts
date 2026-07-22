import { RegistrationFormData, UserRole } from "@/lib/validation";

interface BuyerRegistrationApiPayload {
  email: string;
  full_name: string;
  password: string;
  confirm_password: string;
  terms_accepted: boolean;
  delivery_address?: string;
  company_name?: string;
}

interface SellerRegistrationApiPayload {
  email: string;
  full_name: string;
  business_name: string;
  password: string;
  confirm_password: string;
  terms_accepted: boolean;
  tax_info?: string;
  commercial_info?: string;
}

export type RegistrationApiPayload = BuyerRegistrationApiPayload | SellerRegistrationApiPayload;

export interface ApiFieldErrors {
  [field: string]: string[];
}

export function mapRegistrationToApi(data: RegistrationFormData): RegistrationApiPayload {
  const base = {
    email: data.email.trim().toLowerCase(),
    full_name: data.fullName.trim(),
    password: data.password,
    confirm_password: data.confirmPassword,
    terms_accepted: data.termsAccepted,
  };

  if (data.role === "buyer") {
    return {
      ...base,
      delivery_address: data.deliveryAddress.trim() || undefined,
      company_name: data.companyName.trim() || undefined,
    };
  }

  return {
    ...base,
    business_name: data.businessName.trim(),
  };
}

export function mapApiErrorsToForm(
  errors: ApiFieldErrors,
): Partial<Record<keyof RegistrationFormData, string>> {
  const fieldMap: Record<string, keyof RegistrationFormData> = {
    email: "email",
    full_name: "fullName",
    password: "password",
    confirm_password: "confirmPassword",
    terms_accepted: "termsAccepted",
    business_name: "businessName",
    delivery_address: "deliveryAddress",
    company_name: "companyName",
    non_field_errors: "email",
  };

  const formErrors: Partial<Record<keyof RegistrationFormData, string>> = {};

  for (const [apiField, messages] of Object.entries(errors)) {
    const formField = fieldMap[apiField];
    if (formField && Array.isArray(messages) && messages.length > 0) {
      formErrors[formField] = messages[0];
    }
  }

  return formErrors;
}

export function getRegistrationEndpoint(role: UserRole): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return `${baseUrl}/api/auth/register/${role}/`;
}
