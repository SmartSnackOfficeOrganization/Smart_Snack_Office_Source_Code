"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SmartSnackLogo } from "@/components/layout/SmartSnackLogo";
import { Button } from "@/components/ui/Button";
import { clearAuthSession, getAuthSession } from "@/lib/auth/session";
import { listMyProducts, deleteProduct, SellerCatalogError } from "@/lib/seller/catalog";
import { SellerProduct } from "@/lib/seller/catalog.types";

export default function SellerProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const session = getAuthSession();
    if (!session || session.role !== "seller") {
      router.replace("/login");
      return;
    }

    loadProducts();
  }, [router]);

  async function loadProducts() {
    try {
      setLoading(true);
      setError(null);
      const data = await listMyProducts();
      setProducts(data.results);
    } catch (err) {
      if (err instanceof SellerCatalogError) {
        setError(err.message);
      } else {
        setError("Error al cargar productos.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;

    try {
      setDeletingId(id);
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      if (err instanceof SellerCatalogError) {
        alert(err.message);
      } else {
        alert("Error al eliminar el producto.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  function handleLogout() {
    clearAuthSession();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <SmartSnackLogo href="/seller/dashboard" />
          <Button variant="secondary" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mi catálogo</h1>
            <p className="mt-1 text-sm text-slate-600">
              Gestiona tus productos y fichas nutricionales.
            </p>
          </div>
          <Link href="/seller/products/new">
            <Button>+ Nuevo producto</Button>
          </Link>
        </div>

        {loading && (
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500">Cargando productos…</p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="text-4xl">📦</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              Aún no tienes productos
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Crea tu primer snack y comienza a vender.
            </p>
            <Link href="/seller/products/new" className="mt-6 inline-block">
              <Button>Crear primer producto</Button>
            </Link>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md transition hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{product.name}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      product.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {product.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {product.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                    {product.description}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-brand-700">${product.price}</p>
                    <p className="text-xs text-slate-400">
                      Stock: {product.stock}
                      {product.category && ` · ${product.category.name}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/seller/products/${product.id}/edit`}>
                      <Button variant="secondary">Editar</Button>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(product.id, product.name)}
                      disabled={deletingId === product.id}
                    >
                      {deletingId === product.id ? "…" : "Eliminar"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Link
          href="/seller/dashboard"
          className="mt-8 inline-block text-sm font-semibold text-brand-700 hover:underline"
        >
          ← Volver al panel
        </Link>
      </div>
    </main>
  );
}
