import type { FilterValues } from "./filter-sidebar";

/**
 * Otisak primenjenih filtera — služi kao `key` forme.
 *
 * ── Zašto uopšte postoji ──
 *
 * Polja u sajdbaru su NEKONTROLISANA (`defaultChecked`, `defaultValue`), što je
 * namerno: tako forma radi i bez JavaScripta. Ali `default*` React primenjuje
 * samo pri montiranju elementa.
 *
 * Kad „Poništi filtere" vodi sa `/?ocena=5` na `/`, ruta se ne menja, pa React
 * zadrži iste `<input>` elemente i novi render ih ne dira — kvačica ostaje na
 * ekranu iako je iz adrese nestala. Ista zamka važi za svaku izmenu filtera
 * koja ne menja putanju.
 *
 * Promenom ključa forma se ponovo montira, pa polja krenu od vrednosti koje
 * zaista stoje u adresi.
 *
 * Ključ se računa SAMO iz adrese. Dok korisnik čekira, adresa se ne menja, pa
 * se forma ne remontira i njegov nezavršen izbor ostaje netaknut.
 */
export function kljucFiltera(
  values: FilterValues,
  putanja: { kategorija: string | null; grad: string | null },
): string {
  /* Redosled iz adrese ne sme da pravi novi ključ — `?a&b` i `?b&a` su isto stanje. */
  const niz = (v?: string[]) => [...(v ?? [])].sort().join(",");

  return [
    putanja.kategorija ?? "",
    putanja.grad ?? "",
    niz(values.usluga),
    values.grad ?? "",
    values.cenaOd ?? "",
    values.cenaDo ?? "",
    niz(values.ocena),
    values.verifikovani ?? "",
    values.q ?? "",
  ].join("|");
}
