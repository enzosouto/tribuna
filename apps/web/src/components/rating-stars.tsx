"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  value: number | null;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
}

function StarFill({ fillPercent, size }: { fillPercent: number; size: number }) {
  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      <Star size={size} className="absolute inset-0 text-muted-foreground/40" />
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
        <Star size={size} className="fill-primary text-primary" />
      </span>
    </span>
  );
}

export function RatingStars({ value, onChange, size = 22, readOnly = false }: RatingStarsProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value ?? 0;
  const interactive = !readOnly && !!onChange;

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => interactive && setHover(null)}>
      {Array.from({ length: 5 }, (_, i) => {
        const starValue = i + 1;
        const fillPercent = Math.max(0, Math.min(1, display - i)) * 100;

        if (!interactive) {
          return <StarFill key={i} fillPercent={fillPercent} size={size} />;
        }

        return (
          <span key={i} className="relative" style={{ width: size, height: size }}>
            <StarFill fillPercent={fillPercent} size={size} />
            <button
              type="button"
              aria-label={`${i + 0.5} estrelas`}
              className="absolute inset-y-0 left-0 w-1/2"
              onMouseEnter={() => setHover(i + 0.5)}
              onClick={() => onChange!(i + 0.5)}
            />
            <button
              type="button"
              aria-label={`${starValue} estrelas`}
              className="absolute inset-y-0 right-0 w-1/2"
              onMouseEnter={() => setHover(starValue)}
              onClick={() => onChange!(starValue)}
            />
          </span>
        );
      })}
    </div>
  );
}
