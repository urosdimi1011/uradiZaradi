"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

import styles from "./filter-sidebar.module.css";

/** Deljen između dugmeta u pretrazi i samog dijaloga — otvaranje ide preko DOM-a. */
export const FILTER_DIALOG_ID = "filter-dijalog";

/**
 * Omotač oko filtera: pun ekran na mobilnom, obična kolona na desktopu.
 *
 * Native `<dialog>` umesto sopstvenog overlay-a jer besplatno daje ono što se
 * inače ručno piše i obično zaboravi: zaključavanje fokusa unutar modala,
 * zatvaranje na Esc, `inert` za ostatak stranice i backdrop.
 */
export function FilterDialog({
  children,
  footer,
  title,
  closeLabel,
}: {
  children: ReactNode;
  /** Dugme „Prikaži rezultate" — dolazi spolja jer nosi živi brojač. */
  footer: ReactNode;
  title: string;
  closeLabel: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  /**
   * Ako se prozor proširi dok je modal otvoren, dijalog mora da se zatvori —
   * inače na desktopu ostane zaključan fokus u elementu koji sada izgleda
   * kao obična kolona, i stranica deluje zamrznuto.
   */
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      if (mq.matches && ref.current?.open) ref.current.close();
    };
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <dialog id={FILTER_DIALOG_ID} ref={ref} className={styles.dialog} aria-label={title}>
      <div className={styles.dialogHeader}>
        <span className={styles.dialogTitle}>{title}</span>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className={styles.dialogClose}
          aria-label={closeLabel}
        >
          <X width={20} height={20} aria-hidden />
        </button>
      </div>

      <div className={styles.dialogScroll}>{children}</div>

      {/*
        Dugme šalje formu iz panela preko `form` atributa, pa može da stoji
        zakucano za dno modala umesto unutar forme.
      */}
      <div className={styles.dialogFooter}>{footer}</div>
    </dialog>
  );
}
