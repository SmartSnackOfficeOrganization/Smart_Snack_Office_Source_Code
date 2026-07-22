import { Button } from "@/components/ui/Button";

interface SortSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const SORT_OPTIONS = [
  { value: "-created_at", label: "Más recientes" },
  { value: "price", label: "Menor precio" },
  { value: "-price", label: "Mayor precio" },
  { value: "-review_count", label: "Más reseñas" },
];

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-sm text-slate-600">
        Ordenar por:
      </label>
      <select
        id="sort-select"
        value={value || "-created_at"}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
