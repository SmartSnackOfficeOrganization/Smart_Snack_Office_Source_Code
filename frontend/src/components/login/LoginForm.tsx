"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { SmartSnackLogo } from "@/components/layout/SmartSnackLogo";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { AuthError } from "@/lib/auth/types";
import { getDashboardPath, login, MOCK_USERS } from "@/lib/auth/login";
import {
  LoginFormData,
  LoginFormErrors,
  validateLoginForm,
} from "@/lib/validation";

const initialFormData: LoginFormData = {
  email: "",
  password: "",
};

export function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<LoginFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LoginFormData, boolean>>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof LoginFormData>(field: K, value: LoginFormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setAuthError(null);

    if (touched[field]) {
      const nextData = { ...formData, [field]: value };
      setFieldErrors(validateLoginForm(nextData));
    }
  }

  function handleBlur(field: keyof LoginFormData) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors(validateLoginForm(formData));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);
    setTouched({ email: true, password: true });

    const validationErrors = validateLoginForm(formData);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const session = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      router.push(getDashboardPath(session.role));
    } catch (error) {
      if (error instanceof AuthError) {
        setAuthError(error.message);
      } else {
        setAuthError("Correo o contraseña incorrectos");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 text-center sm:text-left">
        <SmartSnackLogo />
        <h1 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">Inicia sesión</h1>
        <p className="mt-2 text-sm text-slate-600">
          Accede a tu panel de comprador o vendedor en Smart Snack.
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

          <FormField
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
            onBlur={() => handleBlur("password")}
            error={touched.password ? fieldErrors.password : undefined}
          />
        </div>

        <div className="mt-8 space-y-4">
          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
          </Button>

          <p className="text-center text-sm text-slate-600">
            <Link
              href="/forgot-password"
              className="font-semibold text-brand-700 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </p>

          <p className="text-center text-sm text-slate-600">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="font-semibold text-brand-700 hover:underline">
              Regístrate
            </Link>
          </p>
        </div>

        <details className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-500">
          <summary className="cursor-pointer font-medium text-slate-600">
            Credenciales de prueba (simulación)
          </summary>
          <ul className="mt-2 space-y-1">
            {MOCK_USERS.map((user) => (
              <li key={user.email}>
                <span className="font-medium text-slate-700">
                  {user.role === "buyer" ? "Comprador" : "Vendedor"}:
                </span>{" "}
                {user.email} / {user.password}
              </li>
            ))}
          </ul>
        </details>
      </form>
    </div>
  );
}
