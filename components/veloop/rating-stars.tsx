"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  className?: string;
  readOnly?: boolean;
}

export function RatingStars({ value, onChange, size = 20, className, readOnly }: RatingStarsProps) {
  const interactive = Boolean(onChange) && !readOnly;
  return (
    <div className={cn("inline-flex items-center gap-1", className)} role={interactive ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        const Cmp = interactive ? "button" : "span";
        return (
          <Cmp
            key={star}
            type={interactive ? "button" : undefined}
            aria-label={interactive ? `${star} étoile${star > 1 ? "s" : ""}` : undefined}
            onClick={interactive ? () => onChange!(star) : undefined}
            className={cn(interactive && "transition-transform hover:scale-110 active:scale-95")}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(filled ? "fill-amber-400 text-amber-400" : "fill-transparent text-muted-foreground/40")}
            />
          </Cmp>
        );
      })}
    </div>
  );
}
