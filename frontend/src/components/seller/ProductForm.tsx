"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import {
  CreateProductData,
  UpdateProductData,
  NutritionFactsData,
} from "@/lib/seller/catalog.types";

interface ProductFormProps {
  initialData?: {
    name: string;
    description: string;
    ingredients: string;
    price: number;
    stock: number;
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
  const [showNutrition, setShowNutrition] = useState(
    initialData?.nutrition_facts != null,
  );

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
    } catch {
      setSubmitError("Error al guardar. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

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
