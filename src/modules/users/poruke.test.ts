import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Nijedna poruka o grešci ne sme da bude na engleskom.
 *
 * Ovo je test nad IZVOROM, ne nad ponašanjem — namerno. Greška se ovde ne
 * pravi pogrešnom logikom nego zaboravljenim prevodom, a to se ne vidi dok
 * korisnik ne naleti baš na taj kod. Jednom je već promaklo: nepoznat kod je
 * padao na `error.message` iz better-auth-a, pa je usred ćiriličnog sajta
 * iskočilo „User already exists. Use another email."
 */

const izvor = readFileSync("src/modules/users/actions.ts", "utf8");

/** Sve vrednosti iz mape `PORUKE` — tekst koji stvarno vidi korisnik. */
function porukeIzMape(): string[] {
  const blok = izvor.slice(izvor.indexOf("const PORUKE"), izvor.indexOf("const OPSTA_GRESKA"));
  return [...blok.matchAll(/:\s*"([^"]+)"/g)].map((m) => m[1]!);
}

describe("poruke o greškama", () => {
  it("mapa nije prazna", () => {
    expect(porukeIzMape().length).toBeGreaterThan(5);
  });

  /*
   * Srpska rečenica skoro uvek ima bar jedno naše slovo ili karakterističnu
   * reč. Engleska nema nijedno — po tome se razlikuju bez rečnika.
   */
  it.each(porukeIzMape())("%s — na srpskom je", (poruka) => {
    const nasaSlova = /[čćžšđČĆŽŠĐ]/.test(poruka);
    const nasaRec =
      /\b(je|su|nije|ili|sa|za|se|ne|vam|vas|da|mora|ima|nalog|lozinka|pošta|pokušajte|unesite|potvrdite|veza|podaci|prijava|prijave|greške)\b/i.test(
        poruka,
      );
    expect(nasaSlova || nasaRec).toBe(true);
  });

  it.each(porukeIzMape())("%s — bez engleskih reči", (poruka) => {
    expect(poruka).not.toMatch(/\b(user|email|password|already|exists|invalid|failed|not)\b/i);
  });

  /*
   * Ovo je srž ispravke: nepoznat kod NE SME da padne na `error.message`, jer
   * je taj tekst iz biblioteke i uvek je engleski.
   */
  it("nepoznat kod ne vraća poruku iz biblioteke", () => {
    const telo = izvor.slice(izvor.indexOf("function poruka("), izvor.indexOf("function greskePolja"));
    expect(telo).toContain("OPSTA_GRESKA");
    expect(telo).not.toMatch(/return\s+.*error\.message/);
  });

  /* Kod koji je promakao prvi put — da se ne izgubi pri nekom čišćenju mape. */
  it("pokriva kod koji better-auth zaista vraća za zauzet mejl", () => {
    expect(izvor).toContain("USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL");
  });
});
