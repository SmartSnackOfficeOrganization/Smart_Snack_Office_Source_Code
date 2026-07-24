import Link from "next/link";
import { CatalogProduct } from "@/lib/catalog-browse.types";
import { StarRating } from "@/components/ui/StarRating";

interface ProductGridProps {
  products: CatalogProduct[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-slate-500">
          No se encontraron productos con los filtros seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/buyer/products/${product.id}`}
          className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md transition hover:shadow-lg"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              {product.name}
            </h3>
            {product.is_featured && (
              <span className="shrink-0 rounded-full bg-accent-100 px-2 py-0.5 text-xs font-semibold text-accent-700">
                Destacado
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-500">
              {product.description}
            </p>
          )}

          <div className="mt-auto flex items-end justify-between pt-4">
            <div>
              <p className="text-lg font-bold text-brand-700">${product.price}</p>
              {product.category && (
                <p className="mt-1 text-xs text-slate-400">
                  {product.category.name}
                </p>
              )}
            </div>
            <div className="text-right">
              <StarRating avgRating={product.avg_rating} size="sm" />
              <p className="mt-0.5 text-xs text-slate-400">
                {product.review_count} reseña
                {product.review_count !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {product.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
              {product.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                >
                  {tag}
                </span>
              ))}
              {product.tags.length > 3 && (
                <span className="text-xs text-slate-400">
                  +{product.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
