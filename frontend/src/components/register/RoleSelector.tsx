import { UserRole } from "@/lib/validation";

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  error?: string;
}

const roles: {
  id: UserRole;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "buyer",
    title: "Comprador",
    description: "Compra snacks saludables para tu equipo u oficina.",
    icon: "🛒",
  },
  {
    id: "seller",
    title: "Vendedor",
    description: "Publica y vende tus productos a empresas.",
    icon: "🏪",
  },
];

export function RoleSelector({ value, onChange, error }: RoleSelectorProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-slate-700">
        ¿Cómo quieres usar Smart Snack?
      </legend>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Selección de rol">
        {roles.map((role) => {
          const selected = value === role.id;
          return (
            <button
              key={role.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(role.id)}
              className={`relative rounded-2xl border-2 p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                selected
                  ? "border-brand-500 bg-brand-50 shadow-sm shadow-brand-500/10"
                  : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40"
              }`}
            >
              {selected && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs text-white">
                  ✓
                </span>
              )}
              <span className="text-2xl" aria-hidden>
                {role.icon}
              </span>
              <span className="mt-2 block text-sm font-semibold text-slate-900">
                {role.title}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                {role.description}
              </span>
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
