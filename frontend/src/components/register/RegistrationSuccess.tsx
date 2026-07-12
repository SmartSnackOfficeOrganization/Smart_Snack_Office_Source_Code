import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { UserRole } from "@/lib/validation";

interface RegistrationSuccessProps {
  role: UserRole;
  email: string;
}

export function RegistrationSuccess({ role, email }: RegistrationSuccessProps) {
  const roleLabel = role === "buyer" ? "Comprador" : "Vendedor";

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
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        En un entorno real recibirías un correo de activación. Por ahora, te redirigimos al
        inicio de sesión para continuar.
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <Link href="/login">
          <Button fullWidth>Ir a iniciar sesión</Button>
        </Link>
        <Link href="/">
          <Button variant="secondary" fullWidth>
            Volver al inicio
          </Button>
        </Link>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Redirección automática en unos segundos…
      </p>
    </div>
  );
}
