import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Zvezdice se renderuju kao tekst za čitače ekrana + vizuelne ikone.
 * `aria-hidden` na ikonama, stvarna vrednost u sr-only tekstu — inače
 * screen reader pročita pet praznih span-ova.
 */
export function Stars({
  value,
  size = 14,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          width={size}
          height={size}
          className={i <= rounded ? "fill-brand text-brand" : "fill-line text-line"}
        />
      ))}
      <span className="sr-only">{value.toFixed(1)} od 5</span>
    </span>
  );
}
