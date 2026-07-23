import Link from "next/link";
import { Product } from "@/lib/catalog.types";

interface SearchResultsProps {
  products: Product[];
  query: string;
}

function StarRating({ avgRating }: { avgRating: string }) {
  const rating = parseFloat(avgRating);
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="text-sm">
          {i < fullStars ? "★" : i === fullStars && hasHalf ? "½" : "☆"}
        </span>
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/buyer/products/${product.id}`}
      className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md transition hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">{product.name}</h3>
        {product.is_featured && (
          <span className="shrink-0 rounded-full bg-accent-100 px-2 py-0.5 text-xs font-semibold text-accent-700">
            Destacado
          </span>
        )}
      </div>

      {product.description && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-500">{product.description}</p>
      )}

      <div className="mt-auto flex items-end justify-between pt-4">
        <div>
          <p className="text-lg font-bold text-brand-700">${product.price}</p>
          {product.category && (
            <p className="mt-1 text-xs text-slate-400">{product.category}</p>
          )}
        </div>
        <div className="text-right">
          <StarRating avgRating={product.avg_rating} />
          <p className="mt-0.5 text-xs text-slate-400">
            {product.review_count} reseña{product.review_count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {product.match_stage && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              product.match_stage === "literal"
                ? "bg-brand-50 text-brand-700"
                : "bg-purple-50 text-purple-700"
            }`}
          >
            {product.match_stage === "literal" ? "Coincidencia exacta" : "Relevancia semántica"}
          </span>
        </div>
      )}
    </Link>
  );
}

export function SearchResults({ products, query }: SearchResultsProps) {
  const hasTfidf = products.some((p) => p.match_stage === "tfidf");

  return (
    <div>
      {hasTfidf && (
        <div
          className="mb-6 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-700"
          role="status"
        >
          No se encontraron coincidencias exactas para &ldquo;{query}&rdquo;. Mostrando resultados
          por relevancia semántica.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
