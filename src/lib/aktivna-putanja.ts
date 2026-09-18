/**
 * Da li link vodi na stranicu na kojoj se već nalazimo.
 *
 * ── Tri zamke, sve tri tihe ──
 *
 * 1. `/` je prefiks SVAKE adrese. Naivno `pathname.startsWith(href)` bi označilo
 *    „Početnu" kao aktivnu na svakoj stranici sajta.
 *
 * 2. Podstranica mora da označi svog roditelja: na `/moleri/beograd` u meniju
 *    treba da svetli „Moleri". Zato se gleda i `href + "/"`.
 *
 * 3. Granica mora da bude KOSA CRTA, ne bilo koji znak. Bez toga bi `/moleri`
 *    označavao i `/molerija`, što je drugi zanat i druga stranica.
 *
 * Završna kosa crta se zanemaruje: `/sacuvano` i `/sacuvano/` su ista stranica.
 */
export function jeAktivnaPutanja(pathname: string, href: string): boolean {
  const p = normalizuj(pathname);
  const h = normalizuj(href);

  if (h === "/") return p === "/";
  if (p === h) return true;

  return p.startsWith(`${h}/`);
}

/** Skida upit, fragment i završnu kosu crtu; prazno postaje koren. */
function normalizuj(putanja: string): string {
  const bezUpita = putanja.split(/[?#]/)[0] ?? "";
  const bezKose = bezUpita.replace(/\/+$/, "");
  return bezKose === "" ? "/" : bezKose;
}
