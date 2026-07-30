import Link from "next/link";
import { RecommendedProduct } from "@/lib/recommendations";

const CATEGORY_STYLE: Record<
  string,
  { icon: string; bg: string; text: string }
> = {
  Snacks: { icon: "🥨", bg: "bg-amber-100", text: "text-amber-800" },
  "Bebidas frías": { icon: "🧃", bg: "bg-sky-100", text: "text-sky-800" },
  Frutas: { icon: "🍎", bg: "bg-rose-100", text: "text-rose-800" },
  Barritas: { icon: "🍫", bg: "bg-orange-100", text: "text-orange-800" },
  Granolas: { icon: "🥣", bg: "bg-yellow-100", text: "text-yellow-800" },
  Nueces: { icon: "🥜", bg: "bg-stone-200", text: "text-stone-800" },
  Lacteos: { icon: "🧀", bg: "bg-blue-100", text: "text-blue-800" },
  Cafeteria: { icon: "☕", bg: "bg-amber-200", text: "text-amber-900" },
  Otros: { icon: "📦", bg: "bg-brand-100", text: "text-brand-800" },
};

const FALLBACK_STYLE = {
  icon: "✨",
  bg: "bg-brand-100",
  text: "text-brand-800",
};

function categoryStyle(name: string | null | undefined) {
  if (!name) return FALLBACK_STYLE;
  return CATEGORY_STYLE[name] ?? FALLBACK_STYLE;
}

function primaryBadge(product: RecommendedProduct): string | null {
  if (product.is_featured) return "Destacado";
  if (product.tags.length > 0) return product.tags[0];
  return null;
}

function formatPrice(price: string): string {
  const n = Number(price);
  if (Number.isNaN(n)) return `$${price}`;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

interface RecommendationCardProps {
  product: RecommendedProduct;
}

export function RecommendationCard({ product }: RecommendationCardProps) {
  const style = categoryStyle(product.category?.name);
  const badge = primaryBadge(product);
  const reason =
    product.reason ||
    (product.source === "popularity"
      ? "Popular en tu equipo"
      : "Elegido por compradores como tú");

  return (
    <Link
      href={`/buyer/products/${product.id}`}
      className="group flex w-[220px] shrink-0 flex-col rounded-2xl border border-brand-100/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${style.bg} ${style.text}`}
          aria-hidden
        >
          {style.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-brand-800">
            {product.name}
          </h3>
          <p className="mt-1 text-base font-bold text-brand-700">
            {formatPrice(product.price)}
          </p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">
        {reason}
      </p>

      {badge ? (
        <span className="mt-3 w-fit rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
