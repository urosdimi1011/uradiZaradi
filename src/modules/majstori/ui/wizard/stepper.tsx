import Link from "next/link";
import { Check } from "lucide-react";

import { cn } from "@/lib/cn";
import { KORACI, type KorakSegment } from "@/modules/majstori/domain/wizard";

/**
 * Traka koraka.
 *
 * Za razliku od one iz mock-a, ova nije crtež — zna gde si i šta si završio,
 * i vodi nazad na već popunjene korake.
 *
 * Napred se NE može klikom: korak 2 nudi usluge izabranog zanata, pa bez
 * koraka 1 nema šta da prikaže. Zato su budući koraci `<span>`, a ne link —
 * onemogućen link i dalje izgleda kao link, a ovaj ne treba ni da izgleda.
 */
export function Stepper({
  trenutni,
  zavrseni,
}: {
  trenutni: KorakSegment;
  /** Koraci koji su popunjeni — mogu se otvoriti ponovo. */
  zavrseni: KorakSegment[];
}) {
  const indeksTrenutnog = KORACI.findIndex((korak) => korak.segment === trenutni);

  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 sm:gap-x-3">
      {KORACI.map((korak, i) => {
        const zavrsen = zavrseni.includes(korak.segment);
        const aktivan = korak.segment === trenutni;
        const dostupan = zavrsen && !aktivan;

        const sadrzaj = (
          <>
            <span
              aria-hidden
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-[var(--radius-pill)] text-xs font-semibold transition-colors",
                aktivan && "bg-brand text-brand-foreground",
                !aktivan && zavrsen && "bg-brand/15 text-brand",
                !aktivan && !zavrsen && "bg-surface-hover text-content-muted",
              )}
            >
              {zavrsen && !aktivan ? <Check width={14} height={14} /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm",
                aktivan && "font-medium text-content-primary",
                !aktivan && "text-content-secondary",
              )}
            >
              {korak.naslov}
            </span>
          </>
        );

        return (
          <li key={korak.segment} className="flex items-center gap-2 sm:gap-3">
            {dostupan ? (
              <Link
                href={`/registracija-majstora/${korak.segment}`}
                className="flex items-center gap-2 rounded-[var(--radius-control)] hover:opacity-80"
              >
                {sadrzaj}
              </Link>
            ) : (
              <span
                className="flex items-center gap-2"
                aria-current={aktivan ? "step" : undefined}
              >
                {sadrzaj}
              </span>
            )}

            {/* Crtica između koraka; posle poslednjeg ne stoji ništa. */}
            {i < KORACI.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "hidden h-px w-6 sm:block",
                  i < indeksTrenutnog ? "bg-brand/40" : "bg-line",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
