"use client";

interface StarRatingProps {
  avgRating: string | number;
  interactive?: boolean;
  size?: "sm" | "lg";
  value?: number;
  onChange?: (value: number) => void;
}

const sizeClasses = { sm: "text-sm", lg: "text-lg" };

export function StarRating({
  avgRating,
  interactive = false,
  size = "lg",
  value,
  onChange,
}: StarRatingProps) {
  const rating = interactive ? (value ?? 0) : parseFloat(String(avgRating));
  const fullStars = Math.floor(rating);
  const hasHalf = !interactive && rating - fullStars >= 0.5;

  const stars = Array.from({ length: 5 }, (_, i) => {
    const starIndex = i + 1;
    if (interactive && onChange) {
      return (
        <button
          key={i}
          type="button"
          onClick={() => onChange(starIndex)}
          className={`transition hover:scale-110 ${starIndex <= rating ? "text-amber-400" : "text-slate-300"}`}
          aria-label={`${starIndex} estrella${starIndex !== 1 ? "s" : ""}`}
        >
          {starIndex <= rating ? "★" : "☆"}
        </button>
      );
    }
    return (
      <span key={i} className={starIndex <= fullStars ? "text-amber-400" : (i === fullStars && hasHalf ? "text-amber-400" : "text-slate-300")}>
        {i < fullStars ? "★" : i === fullStars && hasHalf ? "½" : "☆"}
      </span>
    );
  });

  return (
    <div
      className={`flex items-center gap-0.5 ${sizeClasses[size]}`}
      aria-label={`${rating} de 5 estrellas`}
    >
      {stars}
    </div>
  );
}
