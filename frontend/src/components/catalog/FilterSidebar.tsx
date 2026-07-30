"use client";

import { useEffect, useState } from "react";
import { CategoryItem, TagItem } from "@/lib/catalog-browse.types";
import { getCategories, getTags, CatalogBrowseError } from "@/lib/catalog-browse";

interface FilterSidebarProps {
  selectedCategory: string;
  selectedTags: string[];
  priceMin: string;
  priceMax: string;
  inStock: boolean;
  onCategoryChange: (category: string) => void;
  onTagsChange: (tags: string[]) => void;
  onPriceMinChange: (value: string) => void;
  onPriceMaxChange: (value: string) => void;
  onInStockChange: (value: boolean) => void;
}

export function FilterSidebar({
  selectedCategory,
  selectedTags,
  priceMin,
  priceMax,
  inStock,
  onCategoryChange,
  onTagsChange,
  onPriceMinChange,
  onPriceMaxChange,
  onInStockChange,
}: FilterSidebarProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [cats, tgs] = await Promise.all([getCategories(), getTags()]);
        if (!cancelled) {
          setCategories(cats);
          setTags(tgs);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof CatalogBrowseError
              ? err.message
              : "Error al cargar filtros.",
          );
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleTagToggle(tagName: string) {
    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter((t) => t !== tagName));
    } else {
      onTagsChange([...selectedTags, tagName]);
    }
  }

  return (
    <aside className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Categorías</h3>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={() => onCategoryChange("")}
              className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${
                !selectedCategory
                  ? "bg-brand-50 font-medium text-brand-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Todas
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                type="button"
                onClick={() =>
                  onCategoryChange(selectedCategory === cat.id ? "" : cat.id)
                }
                className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${
                  selectedCategory === cat.id
                    ? "bg-brand-50 font-medium text-brand-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Etiquetas</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const active = selectedTags.includes(tag.name);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag.name)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  active
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Precio</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Mín"
            value={priceMin}
            onChange={(e) => onPriceMinChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            aria-label="Precio mínimo"
          />
          <span className="text-sm text-slate-400">—</span>
          <input
            type="number"
            min={0}
            placeholder="Máx"
            value={priceMax}
            onChange={(e) => onPriceMaxChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            aria-label="Precio máximo"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Disponibilidad</h3>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => onInStockChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Solo en stock
        </label>
      </div>
    </aside>
  );
}
