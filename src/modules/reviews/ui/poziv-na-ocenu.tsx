import Link from "next/link";
import { Star } from "lucide-react";

import { cn } from "@/lib/cn";
import type { RazlogZabrane } from "@/modules/reviews/domain/pravila";
import styles from "./poziv-na-ocenu.module.css";

/** Zvezdice idu u DOM obrnuto; CSS ih vraća u red — vidi komentar u modulu. */
const OCENE = [5, 4, 3, 2, 1] as const;

export type Vidljivost =
  /** Sme da oceni — prikazuju se zvezdice. */
  | { vrsta: "moze" }
  /** Gost — zvezdice vode na prijavu pa nazad na formu. */
  | { vrsta: "gost" }
  /** Ne sme (svoj profil, već ocenio, neobjavljen) — poziva nema. */
  | { vrsta: "ne-moze"; razlog: RazlogZabrane };

/**
 * Poziv na ocenjivanje, po ugledu na oglasnike.
 *
 * Zvezdice NISU forma nego pet linkova: klik na treću vodi pravo u formu sa već
 * izabranom trojkom. Tako se prvi korak svede na jedan klik, a ceo tekst
 * recenzije se i dalje piše tamo gde mu je mesto.
 *
 * Bez JavaScripta radi isto — to su obični `<a>` elementi. Punjenje do zvezdice
 * pod kursorom radi CSS.
 *
 * Gost dobija iste zvezdice, ali link vodi na prijavu sa povratkom na formu i
 * sačuvanom ocenom: klik se ne gubi zato što neko nije prijavljen.
 */
export function PozivNaOcenu({
  slug,
  vidljivost,
  varijanta,
  className,
}: {
  slug: string;
  vidljivost: Vidljivost;
  /** `prazno` — nema nijedne recenzije, poziv je glavni sadržaj kartice. */
  varijanta: "prazno" | "sazeto";
  className?: string;
}) {
  if (vidljivost.vrsta === "ne-moze") return null;

  const gost = vidljivost.vrsta === "gost";
  const prazno = varijanta === "prazno";

  const adresa = (ocena: number) => {
    const forma = `/majstor/${slug}/recenzije?ocena=${ocena}`;
    return gost ? `/prijava?next=${encodeURIComponent(forma)}` : forma;
  };

  return (
    <div
      className={cn(
        prazno
          ? "rounded-[var(--radius-control)] border border-dashed border-line px-4 py-7 text-center"
          : "flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4",
        className,
      )}
    >
      {/*
        Sažeta varijanta drži OBA reda u levoj koloni, uz zvezdice desno.
        Ranije je napomena gostu bila zaseban red pune širine, poravnat desno —
        u uskoj koloni profila lomila se na dva reda sa raščupanom ivicom.
      */}
      <div className={prazno ? "" : "min-w-0 flex-1"}>
        <p
          className={cn(
            "font-medium text-content-primary",
            prazno ? "text-sm" : "text-xs",
          )}
        >
          {prazno ? "Budite prvi koji će oceniti ovog majstora" : "Radili ste sa njim?"}
        </p>

        {prazno ? (
          <p className="mt-1 text-xs leading-relaxed text-content-secondary">
            Vaša ocena pomaže sledećem čoveku da izabere. Kliknite na zvezdicu.
          </p>
        ) : gost ? (
          <p className="mt-0.5 text-[0.6875rem] leading-tight text-content-muted">
            Prijavite se — ocena vas čeka.
          </p>
        ) : null}
      </div>

      <div
        className={cn(styles.zvezde, prazno ? "mt-4 justify-center" : "ml-auto")}
        role="group"
        aria-label="Ocenite majstora"
      >
        {OCENE.map((ocena) => (
          <Link
            key={ocena}
            href={adresa(ocena)}
            className={styles.zvezda}
            aria-label={`Ocena ${ocena} od 5`}
            title={`${ocena} od 5`}
          >
            <Star width={prazno ? 30 : 22} height={prazno ? 30 : 22} aria-hidden />
          </Link>
        ))}
      </div>

      {/* U praznoj varijanti napomena ide ispod zvezdica, centrirano — ima mesta. */}
      {gost && prazno ? (
        <p className="mt-3 text-xs text-content-muted">
          Za ocenjivanje je potrebna prijava — ocena vas čeka posle nje.
        </p>
      ) : null}
    </div>
  );
}
