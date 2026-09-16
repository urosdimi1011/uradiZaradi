"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";

import { moderirajRecenzijuAction } from "@/modules/reviews/admin-actions";

/**
 * Odobri / odbij, uz optimističko sklanjanje reda iz liste.
 *
 * Moderacija je posao u nizu — čovek prođe kroz deset recenzija zaredom. Da se
 * posle svake čeka odgovor servera, deset odluka bi trajalo minut umesto deset
 * sekundi.
 */
export function ModeracijaDugmad({ reviewId }: { reviewId: string }) {
  const [uToku, pokreni] = useTransition();
  const [sklonjeno, setSklonjeno] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  function odluci(odluka: "odobri" | "odbij") {
    setSklonjeno(true);
    pokreni(async () => {
      const ishod = await moderirajRecenzijuAction(reviewId, odluka);
      if (!ishod.ok) {
        /* Vraća se u listu ako server odbije — inače bi nestala a ostala u redu. */
        setSklonjeno(false);
        setGreska(ishod.greska ?? "Nije uspelo.");
      }
    });
  }

  if (sklonjeno) return <span className="text-xs text-content-muted">Obrađeno…</span>;

  return (
    <div className="flex items-center gap-2">
      {greska ? <span className="text-xs text-danger">{greska}</span> : null}

      <button
        type="button"
        onClick={() => odluci("odobri")}
        disabled={uToku}
        className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] bg-brand px-3 text-sm font-medium text-brand-foreground"
      >
        {uToku ? <Loader2 width={14} height={14} className="animate-spin" /> : <Check width={14} height={14} />}
        Objavi
      </button>

      <button
        type="button"
        onClick={() => odluci("odbij")}
        disabled={uToku}
        className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-line-strong px-3 text-sm text-content-primary hover:bg-surface-hover"
      >
        <X width={14} height={14} />
        Odbij
      </button>
    </div>
  );
}
