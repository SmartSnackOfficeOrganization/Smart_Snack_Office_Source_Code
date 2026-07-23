"use client";

interface AllergySelectorProps {
  allTags: string[];
  selected: string[];
  onChange: (allergies: string[]) => void;
}

export function AllergySelector({ allTags, selected, onChange }: AllergySelectorProps) {
  function toggle(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700">
        Alergias y restricciones dietéticas
      </label>
      <p className="mb-2 text-xs text-slate-500">
        Selecciona los ingredientes que deseas evitar. El sistema bloqueará productos que contengan estos tags.
      </p>
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => {
          const isActive = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                isActive
                  ? "bg-red-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tag}
              {isActive && " ✕"}
            </button>
          );
        })}
      </div>
      {allTags.length === 0 && (
        <p className="text-xs text-slate-400">
          No hay tags disponibles. Los tags se crean cuando los vendedores agregan productos.
        </p>
      )}
      {selected.length > 0 && (
        <p className="mt-2 text-xs text-slate-500">
          {selected.length} restricción{selected.length !== 1 ? "es" : ""} configurada{selected.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
