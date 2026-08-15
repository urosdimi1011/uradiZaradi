import { Star } from "lucide-react";

import { cn } from "@/lib/cn";
import styles from "./majstor-card.module.css";

/**
 * Ocena majstora: zvezdica, prosek, broj recenzija.
 *
 * Izdvojeno jer se isti par pojavljuje na kartici, na profilu i kasnije u
 * admin listi — a format broja ("4.9", ne "4.90") mora svuda biti isti.
 */
export function MajstorRating({
  average,
  count,
  className,
}: {
  average: number;
  count: number;
  className?: string;
}) {
  return (
    <p className={cn(styles.rating, className)}>
      <Star width={13} height={13} className="fill-brand text-brand" aria-hidden />
      <span className={styles.ratingValue}>{average.toFixed(1)}</span>
      <span className={styles.ratingCount}>({count})</span>
    </p>
  );
}
