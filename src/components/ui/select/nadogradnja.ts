"use client";

import { useSyncExternalStore } from "react";

/** Isti prag kao Tailwind `md`. */
const UPIT = "(min-width: 768px)";

function pretplata(osvezi: () => void) {
  const mq = window.matchMedia(UPIT);
  mq.addEventListener("change", osvezi);
  return () => mq.removeEventListener("change", osvezi);
}

/**
 * Da li se nativni `select` menja komandnim poljem sa pretragom.
 *
 * Dva uslova moraju da važe i oba su ovde:
 *
 * 1. JavaScript radi. Serverski snimak je uvek `false`, pa se i na serveru i
 *    pre hidracije iscrtava nativni `select`. Ko ima ugašen JS ostaje na njemu
 *    i forma mu i dalje radi.
 * 2. Ekran je bar `md`. Na telefonu nativni `select` otvara sistemski točkić
 *    preko celog ekrana — palcem, sa pretragom koju telefon već ima. Nijedna
 *    lista pisana u JS-u to ne pobeđuje, a svaka je manja meta za prst.
 */
export function useNadogradnja(): boolean {
  return useSyncExternalStore(
    pretplata,
    () => window.matchMedia(UPIT).matches,
    () => false,
  );
}
