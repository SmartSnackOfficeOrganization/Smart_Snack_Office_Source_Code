"use client";

import { useEffect, useRef, useState } from "react";
import { RecommendationCard } from "@/components/catalog/RecommendationCard";
import {
  getRecommendations,
  RecommendationsError,
  RecommendedProduct,
} from "@/lib/recommendations";

interface RecommendedSectionProps {
  /** Número de productos a solicitar (mínimo de aceptación: 5). */
  limit?: number;
  className?: string;
}

export function RecommendedSection({
  limit = 5,
  className = "",
}: RecommendedSectionProps) {
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getRecommendations(limit);
        if (cancelled) return;
        if (data.results.length === 0) {
          setVisible(false);
          return;
        }
        setProducts(data.results);
        setVisible(true);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof RecommendationsError) {
          if (err.code === "INELIGIBLE" || err.code === "AUTH") {
            setVisible(false);
            return;
          }
          setError(err.message);
          setVisible(true);
        } else {
          setError("Error al cargar recomendaciones.");
          setVisible(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  function scrollByCards(direction: -1 | 1) {
    const node = scrollerRef.current;
    if (!node) return;
    const amount = Math.min(node.clientWidth * 0.8, 480);
    node.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  if (!visible && !loading) {
    return null;
  }

  if (loading) {
    return (
      <section
        className={`rounded-2xl border border-brand-100/70 bg-gradient-to-br from-brand-50/90 via-white to-accent-50/40 p-5 sm:p-6 ${className}`}
        aria-busy="true"
      >
        <h2 className="text-xl font-semibold text-slate-900">
          Recomendados para ti
        </h2>
        <p className="mt-3 text-sm text-slate-500">Cargando sugerencias…</p>
      </section>
    );
  }

  if (!visible) {
    return null;
  }

  return (
    <section
      className={`rounded-2xl border border-brand-100/70 bg-gradient-to-br from-brand-50/90 via-white to-accent-50/40 p-5 sm:p-6 ${className}`}
      aria-labelledby="recommended-heading"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            id="recommended-heading"
            className="text-xl font-semibold text-slate-900"
          >
            Recomendados para ti
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Curados a partir de tu historial de compra.
          </p>
        </div>
        {!error && products.length > 1 ? (
          <div className="hidden shrink-0 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
              aria-label="Ver anteriores"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
              aria-label="Ver siguientes"
            >
              ›
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <div
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      ) : (
        <div
          ref={scrollerRef}
          className="mt-4 -mx-1 flex gap-3 overflow-x-auto px-1 pb-2 scroll-smooth [scrollbar-width:thin]"
          role="list"
        >
          {products.map((product) => (
            <div key={product.id} role="listitem">
              <RecommendationCard product={product} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
