import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { activateAccount } from "@/lib/auth/activation";
import { UserRole } from "@/lib/validation";

interface RegistrationSuccessProps {
  role: UserRole;
  email: string;
  activationUrl?: string;
}

export function RegistrationSuccess({ role, email, activationUrl }: RegistrationSuccessProps) {
  const roleLabel = role === "buyer" ? "Comprador" : "Vendedor";
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);
  const [activationMessage, setActivationMessage] = useState("");

  async function handleActivate() {
    if (!activationUrl) return;

    setActivating(true);
    try {
      const url = new URL(activationUrl);
      const pathParts = url.pathname.split("/");
      const uidb64 = pathParts[2];
      const token = pathParts[3];

      const result = await activateAccount(uidb64, token);
      setActivated(result.success);
      setActivationMessage(result.message);
    } catch {
      setActivated(false);
      setActivationMessage("Error al activar la cuenta.");
    } finally {
      setActivating(false);
    }
  }

  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-4xl shadow-inner">
        ✅
      </div>
      <h2 className="mt-6 text-2xl font-bold text-slate-900">¡Cuenta creada con éxito!</h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
        Hemos registrado tu cuenta como{" "}
        <span className="font-semibold text-brand-700">{roleLabel}</span> con el correo{" "}
        <span className="font-semibold text-slate-800">{email}</span>.
      </p>

      {!activated && (
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          Tu cuenta está inactiva. Haz click en el botón para activarla y poder iniciar sesión.
        </p>
      )}

      {activationMessage && (
        <div
          className={`mt-4 max-w-sm rounded-xl border px-4 py-3 text-sm ${
            activated
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
          role="alert"
        >
          {activationMessage}
        </div>
      )}

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        {activationUrl && !activated && (
          <Button fullWidth disabled={activating} onClick={handleActivate}>
            {activating ? "Activando cuenta…" : "Activar cuenta"}
          </Button>
        )}

        {activated && (
          <Link href="/login">
            <Button fullWidth>Iniciar sesión</Button>
          </Link>
        )}

        <Link href="/">
          <Button variant="secondary" fullWidth>
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}
