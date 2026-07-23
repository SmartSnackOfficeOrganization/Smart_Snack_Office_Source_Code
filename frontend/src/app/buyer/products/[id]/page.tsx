"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SmartSnackLogo } from "@/components/layout/SmartSnackLogo";
import { Button } from "@/components/ui/Button";
import { CartIconButton } from "@/components/cart/CartIconButton";
import { ProductDetail } from "@/components/buyer/ProductDetail";
import { getProductById, BuyerProductError } from "@/lib/buyer";
import { SellerProduct } from "@/lib/seller/catalog.types";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<SellerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProductById(params.id);
      setProduct(data);
    } catch (err) {
      if (err instanceof BuyerProductError && err.code === "NOT_FOUND") {
        setError("El producto que buscas no existe o ha sido eliminado.");
      } else {
        setError("Error al cargar el producto. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <SmartSnackLogo />
          <div className="flex items-center gap-2">
            <CartIconButton />
            <Button variant="secondary" onClick={() => router.push("/buyer/dashboard")}>
              Volver al panel
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          href="/buyer/catalog"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
        >
          ← Volver al catálogo
        </Link>

        {loading && (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-500">Cargando producto…</p>
          </div>
        )}

        {error && (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && product && <ProductDetail product={product} />}
      </div>
    </main>
  );
}
