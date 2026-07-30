import {
  evaluatePasswordCriteria,
  PASSWORD_CRITERIA_LABELS,
  PasswordCriteria,
} from "@/lib/validation";

interface PasswordCriteriaListProps {
  password: string;
}

function CriteriaItem({ met, label }: { met: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-2 text-xs ${met ? "text-brand-700" : "text-slate-500"}`}>
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          met ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-400"
        }`}
        aria-hidden
      >
        {met ? "✓" : "·"}
      </span>
      {label}
    </li>
  );
}

export function PasswordCriteriaList({ password }: PasswordCriteriaListProps) {
  const criteria: PasswordCriteria = evaluatePasswordCriteria(password);

  if (!password) {
    return (
      <p className="text-xs text-slate-500">
        Usa al menos 8 caracteres con mayúsculas, minúsculas y números.
      </p>
    );
  }

  return (
    <ul className="space-y-1" aria-label="Criterios de seguridad de la contraseña">
      {PASSWORD_CRITERIA_LABELS.map(({ key, label }) => (
        <CriteriaItem key={key} met={criteria[key]} label={label} />
      ))}
    </ul>
  );
}
