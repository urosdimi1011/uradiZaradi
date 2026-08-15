import { Star } from "lucide-react";

import { Stars } from "@/components/ui/stars";
import type { RatingSummary } from "@/modules/majstori/domain";
import { makeT } from "@/lib/dictionary";
import type { Script } from "@/lib/script";

/** Histogram ocena sa mockupa: velika brojka levo, trake 5→1 desno. */
export function RatingBreakdown({
  summary,
  script,
}: {
  summary: RatingSummary;
  script: Script;
}) {
  const t = makeT(script);
  const max = Math.max(1, ...Object.values(summary.distribution).map((v) => v ?? 0));

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
      <div className="shrink-0">
        <p className="text-5xl font-semibold leading-none text-content-primary">
          {summary.average.toFixed(1)}
        </p>
        <Stars value={summary.average} size={15} className="mt-2.5" />
        <p className="mt-1.5 text-sm text-content-muted">
          ({summary.count} {t("reviewsCountLabel")})
        </p>
      </div>

      <ul className="flex-1 space-y-1.5">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const value = summary.distribution[String(star) as "1" | "2" | "3" | "4" | "5"] ?? 0;
          return (
            <li key={star} className="flex items-center gap-2.5">
              <span className="w-3 text-right text-xs text-content-secondary tabular-nums">
                {star}
              </span>
              <Star width={12} height={12} className="fill-brand text-brand" aria-hidden />
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-hover">
                <span
                  className="block h-full rounded-full bg-brand"
                  style={{ width: `${Math.round((value / max) * 100)}%` }}
                />
              </span>
              <span className="w-8 text-right text-xs text-content-muted tabular-nums">
                {value}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
