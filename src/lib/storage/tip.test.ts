import { describe, expect, it } from "vitest";

import { KLJUC, OGRANICENJA, proveriSliku } from "./tip";

/**
 * Pravila za slike.
 *
 * Ista funkcija radi u pretraživaču (pre slanja, zbog udobnosti) i na serveru
 * (pre upisa, zbog zaštite). Zato se testira jednom, a važi na oba mesta.
 */

describe("proveriSliku — tip fajla", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("prihvata %s", (tip) => {
    expect(proveriSliku(tip, 1000).ok).toBe(true);
  });

  /*
   * HEIC je namerno odbijen iako ga iPhone pravi: Chrome na Windows-u ga ne
   * prikazuje, pa bi slika postojala a posetilac video prazan okvir.
   */
  it.each([
    ["image/heic", "iPhone format koji Chrome ne prikazuje"],
    ["image/gif", "animacija nema šta da traži na profilu majstora"],
    ["image/svg+xml", "SVG može da nosi skriptu"],
    ["application/pdf", "nije slika"],
    ["text/html", "nije slika"],
    ["", "prazan tip"],
  ])("odbija %s (%s)", (tip) => {
    const rezultat = proveriSliku(tip, 1000);
    expect(rezultat.ok).toBe(false);
    expect(rezultat.ok === false && rezultat.razlog).toBe("tip");
  });
});

describe("proveriSliku — veličina", () => {
  it("prihvata sliku tačno na granici", () => {
    expect(proveriSliku("image/jpeg", OGRANICENJA.najviseBajtova).ok).toBe(true);
  });

  it("odbija jedan bajt preko granice", () => {
    const rezultat = proveriSliku("image/jpeg", OGRANICENJA.najviseBajtova + 1);
    expect(rezultat.ok).toBe(false);
    expect(rezultat.ok === false && rezultat.razlog).toBe("velicina");
  });

  /* Poruka ide direktno korisniku — mora da kaže i koliko sme. */
  it("poruka o veličini sadrži granicu u megabajtima", () => {
    const rezultat = proveriSliku("image/jpeg", OGRANICENJA.najviseBajtova + 1);
    expect(rezultat.ok === false && rezultat.poruka).toContain("5 MB");
  });

  /* Prvo se javlja pogrešan tip: nema smisla reći „prevelika je" za PDF. */
  it("kod pogrešnog tipa I prevelike slike javlja tip", () => {
    const rezultat = proveriSliku("application/pdf", OGRANICENJA.najviseBajtova * 2);
    expect(rezultat.ok === false && rezultat.razlog).toBe("tip");
  });
});

describe("ključevi u skladištu", () => {
  /*
   * `majstorId` mora da bude u putanji: bez njega se slike jednog majstora ne
   * mogu naći ni obrisati kad se profil briše.
   */
  it.each([
    ["avatar", KLJUC.avatar("maj_7", "a1b2c3")],
    ["fotografija", KLJUC.fotografija("maj_7", "a1b2c3")],
  ])("%s sadrži id majstora", (_, kljuc) => {
    expect(kljuc).toContain("maj_7");
  });

  /*
   * Nasumičan sufiks sprečava da nova slika padne na adresu stare, koju
   * pretraživači i CDN već drže u kešu — inače majstor promeni sliku a
   * posetioci danima gledaju staru.
   */
  it("različit sufiks daje različit ključ", () => {
    expect(KLJUC.avatar("maj_7", "aaa")).not.toBe(KLJUC.avatar("maj_7", "bbb"));
  });

  it.each([
    KLJUC.avatar("maj_7", "a1b2c3"),
    KLJUC.fotografija("maj_7", "a1b2c3"),
  ])("%s ne izlazi iz svog foldera", (kljuc) => {
    expect(kljuc).not.toContain("..");
    expect(kljuc.startsWith("/")).toBe(false);
    expect(kljuc.startsWith("majstori/")).toBe(true);
  });
});
