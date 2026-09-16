"use client";

import type { FormEvent } from "react";

/**
 * Poruke pretraživača na srpskom.
 *
 * Pretraživač svoje poruke piše na jeziku SISTEMA, ne sajta — korisnik sa
 * engleskim Windows-om dobija „Please fill out this field." na srpskom sajtu.
 * `title` atribut to ne rešava: Chrome ga kod `pattern` greške ignoriše.
 * Jedini pouzdan način je `setCustomValidity`.
 *
 * Stoji ovde, a ne u jednom folderu sa formama, jer isto treba i prijavi i
 * registraciji i čarobnjaku za majstore — a poruka koja se razlikuje od forme
 * do forme deluje kao da je sajt sklopljen od tuđih delova.
 */

export type PorukeValidacije = {
  required?: string;
  tooShort?: string;
  tooLong?: string;
  pattern?: string;
};

type Polje = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function odaberiPoruku(el: Polje, poruke: PorukeValidacije | undefined): string {
  if (!poruke) return "";
  const v = el.validity;

  if (v.valueMissing) return poruke.required ?? "";
  if (v.tooShort) return poruke.tooShort ?? "";
  if (v.tooLong) return poruke.tooLong ?? "";
  /* `typeMismatch` je type="email" — ista greška kao naš izraz, ista poruka. */
  if (v.patternMismatch || v.typeMismatch) return poruke.pattern ?? "";
  return "";
}

/**
 * Vraća `onInvalid`/`onInput` koje treba raširiti na polje.
 *
 * Poruka se MORA obrisati na svaki unos — dok je postavljena, polje je za
 * pretraživač trajno neispravno, pa se forma ne bi mogla poslati ni kad
 * korisnik sve ispravi.
 */
export function nativneProvere(poruke: PorukeValidacije | undefined) {
  return {
    onInvalid: (event: FormEvent<Polje>) => {
      const el = event.currentTarget;
      el.setCustomValidity(odaberiPoruku(el, poruke));
    },
    onInput: (event: FormEvent<Polje>) => {
      event.currentTarget.setCustomValidity("");
    },
  };
}
