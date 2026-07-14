"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { SmartSnackLogo } from "@/components/layout/SmartSnackLogo";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { PasswordCriteriaList } from "@/components/register/PasswordCriteriaList";
import { resetPassword } from "@/lib/auth/passwordReset";
import { AuthError } from "@/lib/auth/types";
import {
  ResetPasswordFormData,
  ResetPasswordFormErrors,
  validateResetPasswordForm,
} from "@/lib/validation";

const initialFormData: ResetPasswordFormData = {
  newPassword: "",
  confirmPassword: "",
};

interface ResetPasswordFormProps {
  uidb64: string;
  token: string;
}

export function ResetPasswordForm({ uidb64, token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<ResetPasswordFormData>(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordFormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof ResetPasswordFormData, boolean>>
  >({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof ResetPasswordFormData>(
    field: K,
    value: ResetPasswordFormData[K],
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setAuthError(null);

    if (touched[field]) {
      const nextData = { ...formData, [field]: value };
      setFieldErrors(validateResetPasswordForm(nextData));
    }
  }

  function handleBlur(field: keyof ResetPasswordFormData) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors(validateResetPasswordForm(formData));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);
    setTouched({ newPassword: true, confirmPassword: true });

    const validationErrors = validateResetPasswordForm(formData);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      await resetPassword(uidb64, token, formData.newPassword);
      router.push("/login");
    } catch (error) {
      if (error instanceof AuthError) {
        setAuthError(error.message);
      } else {
        setAuthError("Error al restablecer la contraseña. Intenta de nuevo.");
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
          Nueva contraseña
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Ingresa tu nueva contraseña para acceder a tu cuenta.
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

        <div className="space-y-5">
          <FormField
            label="Nueva contraseña"
            name="newPassword"
            error={touched.newPassword ? fieldErrors.newPassword : undefined}
          >
            <input
              id="newPassword"
              className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${
                touched.newPassword && fieldErrors.newPassword
                  ? "border-red-400"
                  : "border-slate-200"
              }`}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={formData.newPassword}
              onChange={(e) => updateField("newPassword", e.target.value)}
              onBlur={() => handleBlur("newPassword")}
              aria-invalid={Boolean(touched.newPassword && fieldErrors.newPassword)}
              aria-describedby={
                touched.newPassword && fieldErrors.newPassword
                  ? "newPassword-error"
                  : undefined
              }
            />
            <div className="mt-2">
              <PasswordCriteriaList password={formData.newPassword} />
            </div>
          </FormField>

          <FormField
            label="Confirmar contraseña"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            onBlur={() => handleBlur("confirmPassword")}
            error={
              touched.confirmPassword ? fieldErrors.confirmPassword : undefined
            }
          />
        </div>

        <div className="mt-8 space-y-4">
          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Restableciendo contraseña…" : "Restablecer contraseña"}
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
