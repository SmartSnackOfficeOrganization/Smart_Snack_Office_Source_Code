"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SmartSnackLogo } from "@/components/layout/SmartSnackLogo";
import { Button } from "@/components/ui/Button";
import { ProductForm } from "@/components/seller/ProductForm";
import { getAuthSession } from "@/lib/auth/session";
import { createProduct, SellerCatalogError } from "@/lib/seller/catalog";
import { CreateProductData } from "@/lib/seller/catalog.types";

export default function NewProductPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getAuthSession();
    if (!session || session.role !== "seller") {
      router.replace("/login");
    }
  }, [router]);

  async function handleSubmit(data: CreateProductData) {
    try {
      await createProduct(data);
      router.push("/seller/products");
    } catch (err) {
      if (err instanceof SellerCatalogError) {
        throw err;
      }
      throw new Error("Error al crear el producto.");
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
        <h1 className="text-2xl font-bold text-slate-900">Nuevo producto</h1>
        <p className="mt-1 text-sm text-slate-600">
          Agrega un nuevo snack al catálogo de Smart Snack.
        </p>

        <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8">
          <ProductForm
            onSubmit={handleSubmit}
            submitLabel="Crear producto"
            submittingLabel="Creando…"
          />
        </div>
      </div>
    </main>
  );
}
