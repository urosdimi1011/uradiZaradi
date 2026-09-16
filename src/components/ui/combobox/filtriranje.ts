import { normalizeForSearch } from "@/lib/translit";

export type Opcija = {
  /** Vrednost koja se šalje formom. Prazan string je dozvoljen („Cela Srbija"). */
  vrednost: string;
  /** Ono što korisnik vidi i po čemu pretražuje. */
  tekst: string;
};

/**
 * Filtriranje opcija po unetom tekstu.
 *
 * Ide kroz `normalizeForSearch`, istu funkciju kojom se gradi `searchText` u
 * bazi — zato „cacak" nalazi „Čačak", a „ниш" nalazi „Niš". Da se ovde poredio
 * sirov tekst, pretraga u padajućoj listi ponašala bi se drugačije od pretrage
 * na sajtu, a to je razlika koju niko ne bi prijavio kao grešku nego bi samo
 * zaključio da pretraga ne radi.
 *
 * Traži se BILO GDE u nazivu, ne samo na početku: „sad" mora da nađe „Novi Sad".
 */
export function filtrirajOpcije(opcije: Opcija[], upit: string): Opcija[] {
  const trazeno = normalizeForSearch(upit);
  if (!trazeno) return opcije;
  return opcije.filter((o) => normalizeForSearch(o.tekst).includes(trazeno));
}
