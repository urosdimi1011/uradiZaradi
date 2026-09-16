import { describe, expect, it } from "vitest";

import { tekst } from "./profile-banner";
import type { StanjeProfila } from "@/modules/users/routing";

/**
 * Tekstovi trake o stanju profila.
 *
 * Ovde se ne testira izgled — to je posao E2E testa u pravom pretraživaču.
 * Testira se jedino ono što TypeScript ne može da proveri: da je „kratka"
 * varijanta stvarno kratka.
 *
 * Tip već zahteva da `kratko` postoji, pa ga niko ne može izostaviti. Ali niko
 * ne sprečava da neko tamo upiše celu rečenicu — a onda se traka na telefonu
 * tiho vrati na tri reda i pojede osminu ekrana, kao pre ove izmene.
 */

const SVA_STANJA: StanjeProfila[] = [
  { vrsta: "nije-zapocet" },
  { vrsta: "u-izradi" },
  { vrsta: "u-pregledu" },
  { vrsta: "skinut" },
  { vrsta: "objavljen", slug: "pera-moler-beograd" },
];

/* Izmereno: na 320px u jedan red staje oko 30 znakova uz dugme sa strane. */
const NAJDUZE_KRATKO = 30;
const NAJDUZA_KRATKA_AKCIJA = 12;

describe("traka — kada se uopšte prikazuje", () => {
  it("objavljen profil nema traku", () => {
    expect(tekst({ vrsta: "objavljen", slug: "pera-moler-beograd" })).toBeNull();
  });

  it("korisnik koji nije majstor nema traku", () => {
    expect(tekst(null)).toBeNull();
  });

  /* „skinut" i „u-pregledu" TAKOĐE moraju da se jave — majstor bi inače mislio
     da je profil živ, a niko ga ne zove. */
  it.each([
    [{ vrsta: "nije-zapocet" }],
    [{ vrsta: "u-izradi" }],
    [{ vrsta: "u-pregledu" }],
    [{ vrsta: "skinut" }],
  ] as StanjeProfila[][])("svako nedovršeno stanje ima poruku: %o", (stanje) => {
    expect(tekst(stanje)).not.toBeNull();
  });
});

describe("traka — kratka varijanta za telefon", () => {
  const poruke = SVA_STANJA.map((s) => [s.vrsta, tekst(s)] as const).filter(
    ([, p]) => p !== null,
  );

  it.each(poruke)("%s: kratko staje u jedan red", (_, poruka) => {
    expect(poruka!.kratko.length).toBeLessThanOrEqual(NAJDUZE_KRATKO);
  });

  it.each(poruke)("%s: kratko je zaista kraće od pune rečenice", (_, poruka) => {
    expect(poruka!.kratko.length).toBeLessThan(poruka!.naslov.length);
  });

  it.each(poruke)("%s: kratka akcija staje pored teksta", (_, poruka) => {
    const kratka = poruka!.kratkaAkcija ?? poruka!.akcija;
    if (!kratka) return;
    expect(kratka.length).toBeLessThanOrEqual(NAJDUZA_KRATKA_AKCIJA);
  });
});

describe("traka — linkovi", () => {
  /*
   * Dugme bez adrese ili adresa bez dugmeta znači ili mrtav klik ili nevidljiv
   * link. Oba moraju da postoje zajedno ili nijedno.
   */
  it.each(SVA_STANJA)("akcija i adresa idu u paru: %o", (stanje) => {
    const poruka = tekst(stanje);
    if (!poruka) return;
    expect(Boolean(poruka.akcija)).toBe(Boolean(poruka.href));
  });

  it("nedovršen profil vodi na popunjavanje", () => {
    for (const vrsta of ["nije-zapocet", "u-izradi"] as const) {
      expect(tekst({ vrsta })?.href).toBe("/registracija-majstora");
    }
  });
});
