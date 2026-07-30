"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { SmartSnackLogo } from "@/components/layout/SmartSnackLogo";
import { Button } from "@/components/ui/Button";
import { CartIconButton } from "@/components/cart/CartIconButton";
import { NoResults } from "@/components/search/NoResults";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { searchProducts } from "@/lib/catalog";
import { Product } from "@/lib/catalog.types";

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / 20);

  const fetchResults = useCallback(async (query: string, pageNum: number) => {
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const data = await searchProducts(query, pageNum);
      setProducts(data.results);
      setTotalCount(data.count);
    } catch {
      setError("Error al buscar productos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (q) {
      fetchResults(q, page);
    }
  }, [q, page, fetchResults]);

  function handleSearch(query: string) {
    router.push(`/buyer/search?q=${encodeURIComponent(query)}`);
  }

  function goToPage(newPage: number) {
    router.push(`/buyer/search?q=${encodeURIComponent(q)}&page=${newPage}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <SmartSnackLogo href="/buyer/dashboard" />
          <div className="flex items-center gap-2">
            <CartIconButton />
            <Button variant="secondary" onClick={() => router.push("/buyer/dashboard")}>
              Volver al panel
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <SearchBar defaultValue={q} onSearch={handleSearch} />
        </div>

        {loading && (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-500">Buscando productos…</p>
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

        {!loading && !error && q && products.length === 0 && <NoResults query={q} />}

        {!loading && !error && products.length > 0 && (
          <>
            <p className="mb-4 text-sm text-slate-500">
              {totalCount} resultado{totalCount !== 1 ? "s" : ""} para &ldquo;{q}&rdquo;
            </p>
            <SearchResults products={products} query={q} />

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm text-slate-600">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}

        {!loading && !error && !q && (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-500">
              Escribe un término de búsqueda para encontrar productos.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500">Cargando…</p>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
