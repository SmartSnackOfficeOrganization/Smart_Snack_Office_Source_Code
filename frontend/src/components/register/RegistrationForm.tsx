"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { SmartSnackLogo } from "@/components/layout/SmartSnackLogo";
import { PasswordCriteriaList } from "@/components/register/PasswordCriteriaList";
import { RegistrationSuccess } from "@/components/register/RegistrationSuccess";
import { RoleSelector } from "@/components/register/RoleSelector";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import {
  RegistrationFormData,
  RegistrationFormErrors,
  validateRegistrationForm,
} from "@/lib/validation";

const initialFormData: RegistrationFormData = {
  role: "buyer",
  fullName: "",
  businessName: "",
  companyName: "",
  deliveryAddress: "",
  email: "",
  password: "",
  confirmPassword: "",
  termsAccepted: false,
};

export function RegistrationForm() {
  const [formData, setFormData] = useState<RegistrationFormData>(initialFormData);
  const [errors, setErrors] = useState<RegistrationFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof RegistrationFormData, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isSuccess) return;

    const timer = window.setTimeout(() => {
      window.location.href = "/login";
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [isSuccess]);

  function updateField<K extends keyof RegistrationFormData>(
    field: K,
    value: RegistrationFormData[K],
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const nextData = { ...formData, [field]: value };
      setErrors(validateRegistrationForm(nextData));
    }
  }

  function handleBlur(field: keyof RegistrationFormData) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateRegistrationForm(formData));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({
      role: true,
      fullName: true,
      businessName: true,
      companyName: true,
      deliveryAddress: true,
      email: true,
      password: true,
      confirmPassword: true,
      termsAccepted: true,
    });

    const validationErrors = validateRegistrationForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    // Simulación del flujo exitoso (integración API: POST /api/auth/register/buyer|seller/)
    await new Promise((resolve) => setTimeout(resolve, 900));

    setIsSubmitting(false);
    setIsSuccess(true);
  }

  if (isSuccess) {
    return <RegistrationSuccess role={formData.role} email={formData.email.trim()} />;
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 text-center sm:text-left">
        <SmartSnackLogo />
        <h1 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">Crea tu cuenta</h1>
        <p className="mt-2 text-sm text-slate-600">
          Únete a Smart Snack y lleva snacks saludables a tu equipo corporativo.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8"
      >
        <div className="space-y-6">
          <RoleSelector
            value={formData.role}
            onChange={(role) => updateField("role", role)}
            error={touched.role ? errors.role : undefined}
          />

          <FormField
            label="Nombre completo"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="Ej. María González"
            value={formData.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            onBlur={() => handleBlur("fullName")}
            error={touched.fullName ? errors.fullName : undefined}
          />

          {formData.role === "buyer" && (
            <>
              <FormField
                label="Empresa (opcional)"
                name="companyName"
                type="text"
                placeholder="Ej. TechCorp S.A."
                value={formData.companyName}
                onChange={(e) => updateField("companyName", e.target.value)}
                onBlur={() => handleBlur("companyName")}
                hint="Nombre de la empresa u oficina donde recibirás los pedidos."
              />

              <FormField
                label="Dirección de entrega (opcional)"
                name="deliveryAddress"
                type="text"
                placeholder="Ej. Calle 123 #45-67, Bogotá"
                value={formData.deliveryAddress}
                onChange={(e) => updateField("deliveryAddress", e.target.value)}
                onBlur={() => handleBlur("deliveryAddress")}
                hint="Puedes completarla más adelante desde tu perfil."
              />
            </>
          )}

          {formData.role === "seller" && (
            <FormField
              label="Nombre del negocio"
              name="businessName"
              type="text"
              placeholder="Ej. Snacks Andinos S.A.S."
              value={formData.businessName}
              onChange={(e) => updateField("businessName", e.target.value)}
              onBlur={() => handleBlur("businessName")}
              error={touched.businessName ? errors.businessName : undefined}
              hint="Requerido para vendedores al conectar con la API."
            />
          )}

          <FormField
            label="Correo electrónico"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="usuario@empresa.com"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            error={touched.email ? errors.email : undefined}
          />

          <FormField
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
            onBlur={() => handleBlur("password")}
            error={touched.password ? errors.password : undefined}
          >
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => updateField("password", e.target.value)}
              onBlur={() => handleBlur("password")}
              aria-invalid={Boolean(touched.password && errors.password)}
              className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${
                touched.password && errors.password ? "border-red-400" : "border-slate-200"
              }`}
            />
            <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2.5">
              <PasswordCriteriaList password={formData.password} />
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
            error={touched.confirmPassword ? errors.confirmPassword : undefined}
          />

          <div className="space-y-1.5">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <input
                type="checkbox"
                checked={formData.termsAccepted}
                onChange={(e) => updateField("termsAccepted", e.target.checked)}
                onBlur={() => handleBlur("termsAccepted")}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-600">
                Acepto los{" "}
                <Link href="#" className="font-medium text-brand-700 hover:underline">
                  términos y condiciones
                </Link>{" "}
                y la{" "}
                <Link href="#" className="font-medium text-brand-700 hover:underline">
                  política de privacidad
                </Link>
                .
              </span>
            </label>
            {touched.termsAccepted && errors.termsAccepted && (
              <p className="text-xs text-red-600" role="alert">
                {errors.termsAccepted}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
          </Button>
          <p className="text-center text-sm text-slate-600">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-brand-700 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
