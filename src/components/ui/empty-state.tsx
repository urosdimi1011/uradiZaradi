import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Prazno stanje — šta piše tamo gde još nema sadržaja.
 *
 * Prazan okvir nije neutralan: posetilac ne zna da li majstor nema fotografije
 * ili se stranica nije učitala, pa mu se profil učini pokvarenim. Jedna rečenica
 * to rešava, a uz nju ide i ikonica, jer sam tekst u praznoj kartici izgleda
 * kao greška.
 *
 * Tekst se NE piše iz ugla sistema („nema podataka") nego iz ugla čitaoca:
 * posetilac treba da zna šta to znači, a vlasnik profila da zna šta da uradi.
 * Zato ista sekcija ima dva teksta, zavisno od toga ko gleda.
 */
export function EmptyState({
  icon: Icon,
  naslov,
  opis,
  akcija,
  className,
}: {
  icon: LucideIcon;
  naslov: string;
  /** Jedna rečenica objašnjenja; izostavljena kad naslov sam po sebi dovoljno kaže. */
  opis?: string;
  /** Dugme ili link — stoji samo kad čitalac zaista može nešto da uradi. */
  akcija?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-[var(--radius-control)] border border-dashed border-line px-6 py-10 text-center",
        className,
      )}
    >
      <Icon width={24} height={24} aria-hidden className="text-content-muted" />

      <p className="text-sm font-medium text-content-secondary">{naslov}</p>

      {opis ? (
        <p className="max-w-xs text-xs leading-relaxed text-content-muted">{opis}</p>
      ) : null}

      {akcija ? <div className="mt-2">{akcija}</div> : null}
    </div>
  );
}
