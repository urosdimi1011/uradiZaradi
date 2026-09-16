/**
 * Podaci forme u upitni deo URL-a.
 *
 * Prazne vrednosti ispadaju — inače bi izbor „Cela Srbija" ostavio `?grad=` u
 * adresi, a to je druga adresa za istu stranicu. Za sajt kome je pretraživač
 * glavni izvor posetilaca to nije sitnica nego duplirani sadržaj.
 */
export function upitIzForme(podaci: FormData): string {
  const params = new URLSearchParams();

  for (const [kljuc, vrednost] of podaci.entries()) {
    if (typeof vrednost !== "string") continue;
    if (vrednost === "") continue;
    /* `append`, ne `set`: polja se ponavljaju (`usluga`, `ocena`). */
    params.append(kljuc, vrednost);
  }

  return params.toString();
}

/** Puna adresa za `router.push`. */
export function adresaIzForme(osnova: string, podaci: FormData): string {
  const upit = upitIzForme(podaci);
  return upit ? `${osnova}?${upit}` : osnova;
}
