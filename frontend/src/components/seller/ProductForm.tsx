"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import {
  Category,
  CreateProductData,
  UpdateProductData,
  NutritionFactsData,
  Tag,
} from "@/lib/seller/catalog.types";
import { listCategories, listTags } from "@/lib/seller/catalog";

interface ProductFormProps {
  initialData?: {
    name: string;
    description: string;
    ingredients: string;
    price: number;
    stock: number;
    category_id?: string;
    tags?: string[];
    nutrition_facts: NutritionFactsData | null;
  };
  onSubmit: (data: CreateProductData | UpdateProductData) => Promise<void>;
  submitLabel: string;
  submittingLabel: string;
}

interface FormErrors {
  name?: string;
  price?: string;
  stock?: string;
  category_id?: string;
  tags?: string;
  calories?: string;
  protein_g?: string;
  fat_g?: string;
  carbs_g?: string;
  sugar_g?: string;
  sodium_mg?: string;
}

export function ProductForm({
  initialData,
  onSubmit,
  submitLabel,
  submittingLabel,
}: ProductFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [ingredients, setIngredients] = useState(initialData?.ingredients ?? "");
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "");
  const [stock, setStock] = useState(initialData?.stock?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [showNutrition, setShowNutrition] = useState(
    initialData?.nutrition_facts != null,
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [calories, setCalories] = useState(
    initialData?.nutrition_facts?.calories?.toString() ?? "",
  );
  const [proteinG, setProteinG] = useState(
    initialData?.nutrition_facts?.protein_g?.toString() ?? "",
  );
  const [fatG, setFatG] = useState(
    initialData?.nutrition_facts?.fat_g?.toString() ?? "",
  );
  const [carbsG, setCarbsG] = useState(
    initialData?.nutrition_facts?.carbs_g?.toString() ?? "",
  );
  const [sugarG, setSugarG] = useState(
    initialData?.nutrition_facts?.sugar_g?.toString() ?? "",
  );
  const [sodiumMg, setSodiumMg] = useState(
    initialData?.nutrition_facts?.sodium_mg?.toString() ?? "",
  );
  const [servingSize, setServingSize] = useState(
    initialData?.nutrition_facts?.serving_size ?? "",
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [cats, tags] = await Promise.all([listCategories(), listTags()]);
        setCategories(cats);
        setAvailableTags(tags);
      } catch {
        // Options will remain empty; form still works
      } finally {
        setLoadingOptions(false);
      }
    }
    void loadOptions();
  }, []);

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = "El nombre es obligatorio.";
    }

    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = "El precio debe ser mayor a 0.";
    }

    const stockNum = parseInt(stock, 10);
    if (stock === "" || isNaN(stockNum) || stockNum < 0) {
      newErrors.stock = "El stock no puede ser negativo.";
    }

    if (!categoryId) {
      newErrors.category_id = "Selecciona una categoría.";
    }

    if (selectedTags.length === 0) {
      newErrors.tags = "Agrega al menos un tag.";
    }

    if (showNutrition) {
      if (calories && isNaN(parseFloat(calories))) {
        newErrors.calories = "Debe ser un número.";
      }
      if (proteinG && isNaN(parseFloat(proteinG))) {
        newErrors.protein_g = "Debe ser un número.";
      }
      if (fatG && isNaN(parseFloat(fatG))) {
        newErrors.fat_g = "Debe ser un número.";
      }
      if (carbsG && isNaN(parseFloat(carbsG))) {
        newErrors.carbs_g = "Debe ser un número.";
      }
      if (sugarG && isNaN(parseFloat(sugarG))) {
        newErrors.sugar_g = "Debe ser un número.";
      }
      if (sodiumMg && isNaN(parseFloat(sodiumMg))) {
        newErrors.sodium_mg = "Debe ser un número.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function addTag(tagName: string) {
    const trimmed = tagName.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  }

  function removeTag(tagName: string) {
    setSelectedTags((prev) => prev.filter((t) => t !== tagName));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const data: CreateProductData = {
        name: name.trim(),
        description: description.trim() || undefined,
        ingredients: ingredients.trim() || undefined,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        category_id: categoryId,
        tags: selectedTags,
      };

      if (showNutrition) {
        const nf: NutritionFactsData = {};
        if (calories) nf.calories = parseFloat(calories);
        if (proteinG) nf.protein_g = parseFloat(proteinG);
        if (fatG) nf.fat_g = parseFloat(fatG);
        if (carbsG) nf.carbs_g = parseFloat(carbsG);
        if (sugarG) nf.sugar_g = parseFloat(sugarG);
        if (sodiumMg) nf.sodium_mg = parseFloat(sodiumMg);
        if (servingSize.trim()) nf.serving_size = servingSize.trim();

        if (Object.keys(nf).length > 0) {
          data.nutrition_facts = nf;
        }
      }

      await onSubmit(data);
    } catch (err) {
      if (err instanceof Error && err.message) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Error al guardar. Intenta de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredTags = availableTags.filter(
    (t) => !selectedTags.includes(t.name) && t.name.toLowerCase().includes(tagInput.toLowerCase()),
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {submitError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Información del producto</h2>
        <p className="mt-1 text-sm text-slate-500">
          Datos básicos del snack que quieres ofrecer.
        </p>

        <div className="mt-6 space-y-5">
          <FormField
            label="Nombre del producto"
            name="name"
            placeholder="Ej. Barra de chocolate amargo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />

          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-sm font-medium text-slate-700">
              Descripción
            </label>
            <textarea
              id="description"
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              placeholder="Describe tu producto…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ingredients" className="block text-sm font-medium text-slate-700">
              Ingredientes
            </label>
            <textarea
              id="ingredients"
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              placeholder="Ej. Cacao, almendras, miel…"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="category_id" className="block text-sm font-medium text-slate-700">
              Categoría *
            </label>
            <select
              id="category_id"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loadingOptions}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
            >
              <option value="">
                {loadingOptions ? "Cargando categorías…" : "Seleccionar categoría"}
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="text-xs text-red-600">{errors.category_id}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="tags" className="block text-sm font-medium text-slate-700">
              Tags *
            </label>
            <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-brand-500 hover:text-brand-700"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={selectedTags.length === 0 ? "Escribe y presiona Enter" : ""}
                className="min-w-[120px] flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            {tagInput && filteredTags.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-md">
                {filteredTags.slice(0, 8).map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => addTag(tag.name)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-brand-50"
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
            {errors.tags && (
              <p className="text-xs text-red-600">{errors.tags}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Precio"
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              error={errors.price}
            />
            <FormField
              label="Stock"
              name="stock"
              type="number"
              min="0"
              placeholder="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              error={errors.stock}
            />
          </div>
        </div>
      </section>

      <section>
        <button
          type="button"
          onClick={() => setShowNutrition(!showNutrition)}
          className="flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          <span>{showNutrition ? "▼" : "▶"}</span>
          Ficha nutricional
          <span className="text-xs font-normal text-slate-500">(opcional)</span>
        </button>

        {showNutrition && (
          <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50 p-5">
            <p className="text-sm text-slate-600">
              Información nutricional por porción para que los compradores conozcan tu producto.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <FormField
                label="Calorías"
                name="calories"
                type="number"
                step="0.01"
                min="0"
                placeholder="kcal"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                error={errors.calories}
              />
              <FormField
                label="Proteína (g)"
                name="protein_g"
                type="number"
                step="0.01"
                min="0"
                placeholder="g"
                value={proteinG}
                onChange={(e) => setProteinG(e.target.value)}
                error={errors.protein_g}
              />
              <FormField
                label="Grasa (g)"
                name="fat_g"
                type="number"
                step="0.01"
                min="0"
                placeholder="g"
                value={fatG}
                onChange={(e) => setFatG(e.target.value)}
                error={errors.fat_g}
              />
              <FormField
                label="Carbohidratos (g)"
                name="carbs_g"
                type="number"
                step="0.01"
                min="0"
                placeholder="g"
                value={carbsG}
                onChange={(e) => setCarbsG(e.target.value)}
                error={errors.carbs_g}
              />
              <FormField
                label="Azúcar (g)"
                name="sugar_g"
                type="number"
                step="0.01"
                min="0"
                placeholder="g"
                value={sugarG}
                onChange={(e) => setSugarG(e.target.value)}
                error={errors.sugar_g}
              />
              <FormField
                label="Sodio (mg)"
                name="sodium_mg"
                type="number"
                step="0.01"
                min="0"
                placeholder="mg"
                value={sodiumMg}
                onChange={(e) => setSodiumMg(e.target.value)}
                error={errors.sodium_mg}
              />
            </div>

            <div className="mt-4">
              <FormField
                label="Tamaño de porción"
                name="serving_size"
                placeholder="Ej. 30g, 1 barra, 100ml"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
              />
            </div>
          </div>
        )}
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
