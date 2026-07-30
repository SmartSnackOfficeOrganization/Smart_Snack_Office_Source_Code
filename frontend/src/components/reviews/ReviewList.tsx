"use client";

import { useEffect, useState } from "react";
import { StarRating } from "@/components/ui/StarRating";
import { getReviews, ReviewData } from "@/lib/reviews";

interface ReviewListProps {
  productId: string;
  refreshKey: number;
}

export function ReviewList({ productId, refreshKey }: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getReviews(productId)
      .then((data) => {
        if (!cancelled) {
          setReviews(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("No se pudieron cargar las reseñas.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [productId, refreshKey]);

  if (loading) {
    return <p className="text-sm text-slate-400">Cargando reseñas…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="rounded-xl border border-slate-100 bg-slate-50 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">
                {review.buyer_name}
              </span>
              <StarRating
                avgRating={review.rating}
                size="sm"
              />
            </div>
            <span className="text-xs text-slate-400">
              {new Date(review.created_at).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          {review.comment && (
            <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
}
