"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { SmartSnackLogo } from "@/components/layout/SmartSnackLogo";
import { Button } from "@/components/ui/Button";
import { FilterSidebar } from "@/components/catalog/FilterSidebar";
import { SortSelect } from "@/components/catalog/SortSelect";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { getCatalogProducts, CatalogBrowseError } from "@/lib/catalog-browse";
import { CatalogProduct } from "@/lib/catalog-browse.types";

function CatalogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") ?? "";
  const tags = searchParams.get("tags") ?? "";
  const priceMin = searchParams.get("price_min") ?? "";
  const priceMax = searchParams.get("price_max") ?? "";
  const inStock = searchParams.get("in_stock") === "true";
  const ordering = searchParams.get("ordering") ?? "-created_at";
  const page = Number(searchParams.get("page") ?? "1");

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / 24);

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams();
      const cat = overrides.category ?? category;
      const tg = overrides.tags ?? tags;
      const pMin = overrides.price_min ?? priceMin;
      const pMax = overrides.price_max ?? priceMax;
      const stock = overrides.in_stock != null ? overrides.in_stock : (inStock ? "true" : "");
      const ord = overrides.ordering ?? ordering;
      const pg = overrides.page ?? String(page);

      if (cat) params.set("category", cat);
      if (tg) params.set("tags", tg);
      if (pMin) params.set("price_min", pMin);
      if (pMax) params.set("price_max", pMax);
      if (stock) params.set("in_stock", stock);
      if (ord && ord !== "-created_at") params.set("ordering", ord);
      if (pg && pg !== "1") params.set("page", pg);

      const qs = params.toString();
      return `/buyer/catalog${qs ? `?${qs}` : ""}`;
    },
    [category, tags, priceMin, priceMax, inStock, ordering, page],
  );

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCatalogProducts({
        category: category || undefined,
        tags: tags || undefined,
        price_min: priceMin ? Number(priceMin) : undefined,
        price_max: priceMax ? Number(priceMax) : undefined,
        in_stock: inStock || undefined,
        ordering: ordering || undefined,
        page: page || undefined,
        page_size: 24,
      });
      setProducts(data.results);
      setTotalCount(data.count);
    } catch (err) {
      if (err instanceof CatalogBrowseError) {
        setError(err.message);
      } else {
        setError("Error al cargar el catálogo.");
      }
    } finally {
      setLoading(false);
    }
  }, [category, tags, priceMin, priceMax, inStock, ordering, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function goToPage(newPage: number) {
    router.push(buildUrl({ page: String(newPage) }));
  }

  function handleCategoryChange(value: string) {
    router.push(buildUrl({ category: value, page: "1" }));
  }

  function handleTagsChange(value: string[]) {
    router.push(buildUrl({ tags: value.join(","), page: "1" }));
  }

  function handlePriceMinChange(value: string) {
    router.push(buildUrl({ price_min: value, page: "1" }));
  }

  function handlePriceMaxChange(value: string) {
    router.push(buildUrl({ price_max: value, page: "1" }));
  }

  function handleInStockChange(value: boolean) {
    router.push(buildUrl({ in_stock: value ? "true" : "" }));
  }

  function handleOrderingChange(value: string) {
    router.push(buildUrl({ ordering: value, page: "1" }));
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <SmartSnackLogo />
          <Button variant="secondary" onClick={() => router.push("/buyer/dashboard")}>
            Volver al panel
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Catálogo</h1>
          <SortSelect value={ordering} onChange={handleOrderingChange} />
        </div>

        <div className="mt-6 flex flex-col gap-8 lg:flex-row">
          <div className="w-full shrink-0 lg:w-64">
            <FilterSidebar
              selectedCategory={category}
              selectedTags={tags ? tags.split(",") : []}
              priceMin={priceMin}
              priceMax={priceMax}
              inStock={inStock}
              onCategoryChange={handleCategoryChange}
              onTagsChange={handleTagsChange}
              onPriceMinChange={handlePriceMinChange}
              onPriceMaxChange={handlePriceMaxChange}
              onInStockChange={handleInStockChange}
            />
          </div>

          <div className="min-w-0 flex-1">
            {loading && (
              <div className="py-16 text-center">
                <p className="text-sm text-slate-500">Cargando productos…</p>
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

            {!loading && !error && (
              <>
                <p className="mb-4 text-sm text-slate-500">
                  {totalCount} resultado{totalCount !== 1 ? "s" : ""}
                  {category && " — filtrado por categoría"}
                </p>

                <ProductGrid products={products} />

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
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500">Cargando…</p>
        </div>
      }
    >
      <CatalogPageContent />
    </Suspense>
  );
}
