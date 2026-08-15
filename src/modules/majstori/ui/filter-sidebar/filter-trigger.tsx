"use client";

import { SlidersHorizontal } from "lucide-react";

import { FILTER_DIALOG_ID } from "./filter-dialog";

/**
 * Otvara filter panel na mobilnom.
 *
 * Dijalog se traži preko `getElementById` umesto kroz React context: dugme živi
 * u traci pretrage, a dijalog u koloni sa rezultatima, pa bi deljeno stanje
 * značilo provider preko pola stranice zbog jednog `showModal()` poziva.
 * Ovako je granica jedan stabilan `id`.
 */
export function FilterTrigger({
  label,
  activeCount,
  className,
}: {
  label: string;
  activeCount: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      title={label}
      aria-haspopup="dialog"
      onClick={() => {
        const dialog = document.getElementById(FILTER_DIALOG_ID);
        if (dialog instanceof HTMLDialogElement) dialog.showModal();
      }}
    >
      <SlidersHorizontal width={18} height={18} aria-hidden />
      {activeCount > 0 ? <span data-filter-count>{activeCount}</span> : null}
    </button>
  );
}
