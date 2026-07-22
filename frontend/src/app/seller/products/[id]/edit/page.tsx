"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SmartSnackLogo } from "@/components/layout/SmartSnackLogo";
import { Button } from "@/components/ui/Button";
import { ProductForm } from "@/components/seller/ProductForm";
import { getAuthSession } from "@/lib/auth/session";
import {
  getProductById,
  updateProduct,
  deleteProduct,
  SellerCatalogError,
} from "@/lib/seller/catalog";
import { SellerProduct } from "@/lib/seller/catalog.types";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<SellerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getAuthSession();
    if (!session || session.role !== "seller") {
      router.replace("/login");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProductById(id);
        setProduct(data);
      } catch (err) {
        if (err instanceof SellerCatalogError) {
          setError(err.message);
        } else {
          setError("Error al cargar el producto.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router, id]);

  async function handleSubmit(data: Record<string, unknown>) {
    try {
      await updateProduct(id, data);
      router.push("/seller/products");
    } catch (err) {
      if (err instanceof SellerCatalogError) {
        throw err;
      }
      throw new Error("Error al actualizar el producto.");
    }
  }

  async function handleDelete() {
    if (!product) return;
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;

    try {
      await deleteProduct(id);
      router.push("/seller/products");
    } catch (err) {
      if (err instanceof SellerCatalogError) {
        alert(err.message);
      } else {
        alert("Error al eliminar el producto.");
      }
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <SmartSnackLogo />
          <Button variant="secondary" onClick={() => router.push("/seller/products")}>
            Cancelar
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {loading && (
          <div className="text-center">
            <p className="text-sm text-slate-500">Cargando producto…</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && product && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Editar producto</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Actualiza la información de <span className="font-medium">{product.name}</span>.
                </p>
              </div>
              <Button variant="ghost" onClick={handleDelete}>
                Eliminar producto
              </Button>
            </div>

            <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8">
              <ProductForm
                initialData={{
                  name: product.name,
                  description: product.description ?? "",
                  ingredients: product.ingredients ?? "",
                  price: parseFloat(product.price),
                  stock: product.stock,
                  nutrition_facts: product.nutrition_facts,
                }}
                onSubmit={handleSubmit}
                submitLabel="Guardar cambios"
                submittingLabel="Guardando…"
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
