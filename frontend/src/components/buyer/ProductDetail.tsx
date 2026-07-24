"use client";

import { useState } from "react";
import { SellerProduct } from "@/lib/seller/catalog.types";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { addToCart, CartError } from "@/lib/cart";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";

interface ProductDetailProps {
  product: SellerProduct;
}

function NutritionTable({
  nutrition,
}: {
  nutrition: SellerProduct["nutrition_facts"];
}) {
  if (!nutrition) return null;

  const rows: { label: string; value: string | number | null | undefined }[] = [
    { label: "Calorías", value: nutrition.calories },
    { label: "Proteína (g)", value: nutrition.protein_g },
    { label: "Grasa (g)", value: nutrition.fat_g },
    { label: "Carbohidratos (g)", value: nutrition.carbs_g },
    { label: "Azúcar (g)", value: nutrition.sugar_g },
    { label: "Sodio (mg)", value: nutrition.sodium_mg },
    { label: "Porción", value: nutrition.serving_size },
  ];

  const hasData = rows.some((r) => r.value != null);

  if (!hasData) return null;

  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(
          (row) =>
            row.value != null && (
              <tr key={row.label} className="border-b border-slate-100">
                <td className="py-2 text-slate-600">{row.label}</td>
                <td className="py-2 text-right font-medium text-slate-900">
                  {row.value}
                </td>
              </tr>
            ),
        )}
      </tbody>
    </table>
  );
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [nutritionOpen, setNutritionOpen] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [allergyError, setAllergyError] = useState<string | null>(null);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);
  const isOutOfStock = product.stock <= 0;

  async function handleAddToCart() {
    setAddingToCart(true);
    setCartMessage(null);
    setAllergyError(null);
    try {
      await addToCart(product.id, 1);
      setCartMessage("Agregado al carrito ✓");
      setTimeout(() => setCartMessage(null), 2000);
    } catch (err) {
      if (err instanceof CartError && err.code === "ALLERGY") {
        const allergens = err.allergens?.join(", ") || "alérgenos";
        setAllergyError(
          `No se puede agregar este producto. Contiene ${allergens}, que está en tus restricciones. Configura tus alergias desde Mi Perfil.`,
        );
      } else {
        const msg =
          err instanceof CartError
            ? err.message
            : "Error al agregar al carrito.";
        setCartMessage(msg);
        setTimeout(() => setCartMessage(null), 3000);
      }
    } finally {
      setAddingToCart(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
            isOutOfStock
              ? "bg-red-100 text-red-700"
              : product.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-600"
          }`}
        >
          {isOutOfStock ? "Agotado" : product.status === "active" ? "Disponible" : "Inactivo"}
        </span>
      </div>

      {product.description && (
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          {product.description}
        </p>
      )}

      {product.ingredients && (
        <div className="mt-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Ingredientes
          </h2>
          <p className="mt-1 text-sm text-slate-600">{product.ingredients}</p>
        </div>
      )}

      <hr className="my-5 border-slate-100" />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-bold text-brand-700">${product.price}</p>
          <p className="mt-1 text-sm text-slate-500">
            Stock: {product.stock} {isOutOfStock && "— Producto agotado"}
          </p>
        </div>

        <div className="text-right">
          <StarRating avgRating={product.avg_rating} />
          <p className="mt-0.5 text-xs text-slate-400">
            {product.review_count} reseña{product.review_count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {product.category && (
        <p className="mt-3 text-sm text-slate-500">
          Categoría:{" "}
          <span className="font-medium text-slate-700">{product.category.name}</span>
        </p>
      )}

      {product.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <hr className="my-5 border-slate-100" />

      <div>
        <button
          type="button"
          onClick={() => setNutritionOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          Información nutricional
          <span className="text-slate-400">{nutritionOpen ? "▲" : "▼"}</span>
        </button>
        {nutritionOpen && (
          <div className="mt-3">
            <NutritionTable nutrition={product.nutrition_facts} />
            {!product.nutrition_facts && (
              <p className="text-sm text-slate-400">
                No hay información nutricional disponible.
              </p>
            )}
          </div>
        )}
      </div>

      <hr className="my-5 border-slate-100" />

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Reseñas</h2>
        <ReviewList productId={product.id} refreshKey={reviewRefreshKey} />
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-sm font-medium text-slate-700">Deja tu reseña</p>
          <ReviewForm
            productId={product.id}
            onSuccess={() => setReviewRefreshKey((k) => k + 1)}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          fullWidth
          disabled={isOutOfStock || addingToCart}
          onClick={handleAddToCart}
        >
          {isOutOfStock
            ? "Agotado"
            : addingToCart
              ? "Agregando…"
              : "Agregar al carrito"}
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => alert("Función próximamente disponible")}
        >
          Agregar a lista de deseos
        </Button>
      </div>

      {allergyError && (
        <div
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          <p className="font-semibold">Producto bloqueado</p>
          <p className="mt-1">{allergyError}</p>
          <button
            type="button"
            onClick={() => setAllergyError(null)}
            className="mt-2 text-xs font-medium underline transition hover:text-red-800"
          >
            Entendido
          </button>
        </div>
      )}

      {cartMessage && (
        <p
          className={`mt-3 text-center text-sm ${
            cartMessage.includes("✓")
              ? "text-brand-700"
              : "text-red-600"
          }`}
          role="alert"
        >
          {cartMessage}
        </p>
      )}
    </div>
  );
}
