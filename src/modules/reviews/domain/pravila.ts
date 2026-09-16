import { z } from "zod";

import type { ReviewStatus } from "@/generated/prisma/enums";

/**
 * Pravila za ostavljanje recenzije.
 *
 * Platforma NE VIDI posao — dogovara se telefonom, van sajta. Zato ne postoji
 * dokaz da je neko zaista angažovao majstora, i nijedno pravilo ovde se ne
 * pretvara da ga ima. Cilj nije da lažna recenzija bude nemoguća, nego da bude
 * skupa i vidljiva.
 *
 * Obrazac je preuzet sa KupujemProdajem-a: ono što tamo radi razmena poruka,
 * ovde radi asimetrična moderacija. Kad platforma dobije ćaskanje, iznad ovoga
 * se dodaje uslov „postojala obostrana prepiska" — ništa od ovoga se ne ruši.
 */

export const OCENA_NAJMANJE = 1;
export const OCENA_NAJVISE = 5;

export const TEKST_NAJMANJE = 30;
export const TEKST_NAJVISE = 1500;

/**
 * Ispod ovoga recenzija čeka čoveka.
 *
 * Najvredniji deo celog sistema, i najjeftiniji. Pozitivne idu odmah, pa
 * zadovoljan kupac ne čeka ništa; negativne — kojih je nekoliko procenata —
 * pregleda admin. Konkurent koji piše jedinice tako udara u zid, a moderacija
 * ostaje posao od dva minuta dnevno.
 *
 * Trojka je unutra namerno: ocena 3 uz oštar tekst šteti koliko i jedinica.
 */
export const PRAG_MODERACIJE = 3;

export const recenzijaSchema = z.object({
  rating: z
    .number()
    .int("Ocena mora da bude ceo broj.")
    .min(OCENA_NAJMANJE, "Izaberite ocenu od 1 do 5.")
    .max(OCENA_NAJVISE, "Izaberite ocenu od 1 do 5."),

  body: z
    .string()
    .trim()
    /*
     * Donja granica postoji da „Sve top" ne bi bila recenzija. Kratak tekst ne
     * govori ništa sledećem kupcu, a lažne ocene su po pravilu kratke — pisanje
     * trideset smislenih znakova je prvi trošak koji odvrati.
     */
    .min(TEKST_NAJMANJE, `Napišite bar ${TEKST_NAJMANJE} znakova o tome kako je posao prošao.`)
    .max(TEKST_NAJVISE, `Tekst ne sme da pređe ${TEKST_NAJVISE} znakova.`),

  /* Za koju uslugu — neobavezno, ali daje recenziji težinu i omogućava filter. */
  serviceTypeId: z
    .string()
    .trim()
    .transform((v) => v || null)
    .nullable(),
});

export type RecenzijaUlaz = z.input<typeof recenzijaSchema>;

/**
 * Da li recenzija ide odmah u javnost ili u red za pregled.
 *
 * Nikad se ne odbacuje — samo se odlaže. Odluku donosi čovek.
 */
export function pocetniStatus(rating: number): ReviewStatus {
  return rating <= PRAG_MODERACIJE ? "PENDING" : "PUBLISHED";
}

export type RazlogZabrane = "nije-prijavljen" | "sam-svoj" | "vec-ocenio" | "nije-objavljen";

/**
 * Sme li ovaj korisnik da oceni ovog majstora.
 *
 * Čista funkcija — sve što joj treba pozivalac je već pročitao. Tako se pravila
 * testiraju bez baze, a akcija ostaje kratka.
 */
export function smeDaOceni(uslovi: {
  korisnikId: string | null;
  majstorUserId: string;
  majstorStatus: string;
  vecOcenio: boolean;
}): { sme: true } | { sme: false; razlog: RazlogZabrane } {
  const { korisnikId, majstorUserId, majstorStatus, vecOcenio } = uslovi;

  if (!korisnikId) return { sme: false, razlog: "nije-prijavljen" };

  /* Neobjavljen profil nema javnu stranicu, pa ni recenzije nemaju gde. */
  if (majstorStatus !== "ACTIVE") return { sme: false, razlog: "nije-objavljen" };

  /*
   * Majstor ne sme sebe. Ne zaustavlja drugi nalog — ali zaustavlja i nepažnju
   * i najlenju zloupotrebu, a košta jedno poređenje.
   */
  if (korisnikId === majstorUserId) return { sme: false, razlog: "sam-svoj" };

  /*
   * Jedna recenzija po korisniku po majstoru. Pravilo stoji i u bazi
   * (`@@unique([majstorId, authorUserId])`); ovde je da bi poruka bila
   * razumljiva umesto greške o prekršenom indeksu.
   */
  if (vecOcenio) return { sme: false, razlog: "vec-ocenio" };

  return { sme: true };
}

export const PORUKE_ZABRANE: Record<RazlogZabrane, string> = {
  "nije-prijavljen": "Prijavite se da biste ostavili recenziju.",
  "sam-svoj": "Ne možete oceniti sopstveni profil.",
  "vec-ocenio": "Već ste ocenili ovog majstora.",
  "nije-objavljen": "Ovaj profil trenutno nije objavljen.",
};
