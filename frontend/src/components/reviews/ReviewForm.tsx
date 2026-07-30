"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { createReview, ReviewError } from "@/lib/reviews";

interface ReviewFormProps {
  productId: string;
  onSuccess: () => void;
}

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Debes seleccionar una calificación.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createReview(productId, rating, comment || undefined);
      setRating(0);
      setComment("");
      onSuccess();
    } catch (err) {
      if (err instanceof ReviewError) {
        setError(err.message);
      } else {
        setError("Error al enviar la reseña.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <p className="text-sm font-medium text-slate-700">Tu calificación</p>
        <StarRating
          avgRating={0}
          interactive
          size="lg"
          value={rating}
          onChange={setRating}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="review-comment">
          Tu reseña <span className="text-xs text-slate-400">(opcional, máximo 500 caracteres)</span>
        </label>
        <textarea
          id="review-comment"
          maxLength={500}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comparte tu experiencia con este producto..."
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          rows={3}
        />
        <p className="mt-1 text-right text-xs text-slate-400">{comment.length}/500</p>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Enviando…" : "Enviar reseña"}
      </Button>
    </form>
  );
}
