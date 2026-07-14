"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { SmartSnackLogo } from "@/components/layout/SmartSnackLogo";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { requestPasswordReset, GENERIC_SUCCESS_MESSAGE } from "@/lib/auth/passwordReset";
import { AuthError } from "@/lib/auth/types";
import {
  ForgotPasswordFormData,
  ForgotPasswordFormErrors,
  validateForgotPasswordForm,
} from "@/lib/validation";

const initialFormData: ForgotPasswordFormData = {
  email: "",
};

export function ForgotPasswordForm() {
  const [formData, setFormData] = useState<ForgotPasswordFormData>(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<ForgotPasswordFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ForgotPasswordFormData, boolean>>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function updateField<K extends keyof ForgotPasswordFormData>(
    field: K,
    value: ForgotPasswordFormData[K],
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setAuthError(null);

    if (touched[field]) {
      const nextData = { ...formData, [field]: value };
      setFieldErrors(validateForgotPasswordForm(nextData));
    }
  }

  function handleBlur(field: keyof ForgotPasswordFormData) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors(validateForgotPasswordForm(formData));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);
    setSuccessMessage(null);
    setTouched({ email: true });

    const validationErrors = validateForgotPasswordForm(formData);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const message = await requestPasswordReset(formData.email.trim());
      setSuccessMessage(message);
      setFormData(initialFormData);
      setTouched({});
    } catch (error) {
      if (error instanceof AuthError) {
        setAuthError(error.message);
      } else {
        setAuthError("Error al procesar la solicitud. Intenta de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 text-center sm:text-left">
        <SmartSnackLogo />
        <h1 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">
          Recupera tu contraseña
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8"
      >
        {authError && (
          <div
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
            aria-live="polite"
          >
            {authError}
          </div>
        )}

        {successMessage && (
          <div
            className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            role="status"
            aria-live="polite"
          >
            {successMessage}
          </div>
        )}

        <div className="space-y-5">
          <FormField
            label="Correo electrónico"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="usuario@empresa.com"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            error={touched.email ? fieldErrors.email : undefined}
          />
        </div>

        <div className="mt-8 space-y-4">
          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Enviando enlace…" : "Enviar enlace de recuperación"}
          </Button>

          <p className="text-center text-sm text-slate-600">
            ¿Recordaste tu contraseña?{" "}
            <Link href="/login" className="font-semibold text-brand-700 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
