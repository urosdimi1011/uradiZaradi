import { toSlug } from "@/lib/translit";

/**
 * Adresa profila majstora: `/majstor/petar-petrovic-moler-beograd`.
 *
 * Sastavljena od imena, zanata i grada, jer to je ono što se traži u pretrazi
 * — ta tri pojma zajedno su i razlog zašto stranica uopšte može da se rangira.
 *
 * ── Zašto se NIKAD ne menja posle kreiranja ──
 *
 * Slug nastaje na prvom koraku i tu ostaje. Majstor kasnije sme da promeni ime,
 * zanat i grad — adresa se ne pomera. Da se pomera, svaka izmena profila bi
 * razbila vezu koju Google već ima zapisanu, a stara adresa bi davala 404 dok
 * se ponovo ne indeksira. Cena je što slug vremenom može da ne odgovara sadržaju;
 * to je manje zlo od izgubljenog rangiranja.
 */

/**
 * Osnova bez provere jedinstvenosti.
 *
 * Deo koji unosi korisnik (`ime`) se skraćuje: predugačak naziv radnje dao bi
 * adresu od dvesta znakova, koju niko ne može da podeli.
 */
export function osnovaSluga(ime: string, zanat: string, grad: string): string {
  const delovi = [toSlug(ime).slice(0, 40), toSlug(zanat), toSlug(grad)].filter(Boolean);
  const osnova = delovi.join("-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  /* Ako od svega ostane prazno (npr. ime samo od znakova), mora nešto da stoji. */
  return osnova || "majstor";
}

/**
 * Dodaje brojčani sufiks dok slug ne postane slobodan.
 *
 * Dva Petra Petrovića, oba molera u Beogradu, nisu retkost — drugi dobija
 * `-2`. Provera je `async` jer jedina istina o zauzetosti je u bazi.
 *
 * Granica pokušaja postoji da petlja ne bi trajala doveka ako provera iz bilo
 * kog razloga uvek vraća „zauzeto"; posle nje se dodaje nasumičan sufiks.
 */
export async function jedinstvenSlug(
  osnova: string,
  zauzet: (slug: string) => Promise<boolean>,
  najviePokusaja = 20,
): Promise<string> {
  if (!(await zauzet(osnova))) return osnova;

  for (let i = 2; i <= najviePokusaja; i += 1) {
    const kandidat = `${osnova}-${i}`;
    if (!(await zauzet(kandidat))) return kandidat;
  }

  return `${osnova}-${Math.random().toString(36).slice(2, 8)}`;
}
