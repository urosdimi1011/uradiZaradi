import { describe, expect, it } from "vitest";

import { putanjaZaStanje, stanjeOdStatusa, type StanjeProfila } from "./routing";

/**
 * Gde korisnik sleće posle prijave.
 *
 * Greška ovde ne obara ništa — samo tiho pošalje majstora na pogrešno mesto.
 * Najgori mogući ishod je da majstor sa nedovršenim profilom sleti na naslovnu
 * i nikad ne sazna da ga niko ne vidi.
 */

describe("stanjeOdStatusa", () => {
  it("nema reda u bazi znači da profil nije ni započet", () => {
    expect(stanjeOdStatusa(null)).toEqual({ vrsta: "nije-zapocet" });
  });

  it.each([
    ["DRAFT", { vrsta: "u-izradi" }],
    ["PENDING_REVIEW", { vrsta: "u-pregledu" }],
    ["ACTIVE", { vrsta: "objavljen", slug: "pera-moler-beograd" }],
    ["SUSPENDED", { vrsta: "skinut" }],
    ["BANNED", { vrsta: "skinut" }],
  ] as const)("%s → %o", (status, ocekivano) => {
    expect(stanjeOdStatusa({ status, slug: "pera-moler-beograd" })).toEqual(ocekivano);
  });
});

describe("putanjaZaStanje", () => {
  it("admin ide u admin panel bez obzira na sve ostalo", () => {
    expect(putanjaZaStanje("ADMIN", null)).toBe("/admin");
    expect(putanjaZaStanje("ADMIN", { vrsta: "u-izradi" })).toBe("/admin");
  });

  it("običan korisnik ide na naslovnu", () => {
    expect(putanjaZaStanje("USER", null)).toBe("/");
  });

  /* Vraća se tačno tamo gde je stao — zato i postoji snimanje po koraku. */
  it.each([[{ vrsta: "nije-zapocet" }], [{ vrsta: "u-izradi" }]] as StanjeProfila[][])(
    "majstor sa nedovršenim profilom ide na popunjavanje: %o",
    (stanje) => {
      expect(putanjaZaStanje("MAJSTOR", stanje)).toBe("/registracija-majstora");
    },
  );

  it("objavljen majstor ide na svoj profil", () => {
    expect(putanjaZaStanje("MAJSTOR", { vrsta: "objavljen", slug: "pera-moler-beograd" })).toBe(
      "/majstor/pera-moler-beograd",
    );
  });

  /*
   * Profil na čekanju ili skinut nema javnu stranicu — slanje na `/majstor/...`
   * bi ga dočekalo sa 404 odmah posle prijave.
   */
  it.each([[{ vrsta: "u-pregledu" }], [{ vrsta: "skinut" }]] as StanjeProfila[][])(
    "majstor bez javne stranice ide na nalog: %o",
    (stanje) => {
      expect(putanjaZaStanje("MAJSTOR", stanje)).toBe("/nalog");
    },
  );

  /* Nijedan ishod ne sme da bude apsolutni URL — to bi bio otvoren redirect. */
  it.each([
    ["USER", null],
    ["MAJSTOR", { vrsta: "nije-zapocet" }],
    ["MAJSTOR", { vrsta: "objavljen", slug: "pera-moler-beograd" }],
    ["ADMIN", null],
  ] as const)("uvek vraća putanju unutar sajta (%s)", (role, stanje) => {
    const putanja = putanjaZaStanje(role, stanje);
    expect(putanja.startsWith("/")).toBe(true);
    expect(putanja.startsWith("//")).toBe(false);
  });
});
