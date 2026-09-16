import { describe, expect, it } from "vitest";

import { normalizeForSearch, toCyrillic, toSlug } from "./translit";

/**
 * Pismo i pretraga.
 *
 * Ovo je najopasnije mesto u projektu za tihe greške. Ako se `normalizeForSearch`
 * pokvari, ništa ne pukne — pretraga i dalje vraća rezultate, samo ne one prave.
 * Korisnik koji kuca „cacak" i ne dobije nijednog majstora ne prijavljuje bag,
 * nego zaključi da na sajtu nema majstora u Čačku i ode.
 */

describe("normalizeForSearch", () => {
  /*
   * Isti zapis mora da nastane i iz latinice sa dijakritikom, i iz latinice bez
   * nje, i iz ćirilice. To je cela poenta kolone `searchText`: upit i sadržaj
   * prolaze kroz istu funkciju, pa se sreću na istom obliku.
   */
  it.each([
    ["Keramičar", "Keramicar", "Керамичар"],
    ["Čačak", "Cacak", "Чачак"],
    ["Građevinski", "Gradjevinski", "Грађевински"],
    ["Šabac", "Sabac", "Шабац"],
    ["Žitorađa", "Zitoradja", "Житорађа"],
  ])("%s, %s i %s daju isti zapis", (saKvakama, bezKvaka, cirilica) => {
    const ocekivano = normalizeForSearch(bezKvaka);
    expect(normalizeForSearch(saKvakama)).toBe(ocekivano);
    expect(normalizeForSearch(cirilica)).toBe(ocekivano);
  });

  it("svodi na mala slova", () => {
    expect(normalizeForSearch("MOLER")).toBe("moler");
  });

  it("sabija višestruke razmake i seče sa strane", () => {
    expect(normalizeForSearch("  moler   i   gleter  ")).toBe("moler i gleter");
  });

  it("izbacuje interpunkciju da tačka ne pokvari pogodak", () => {
    expect(normalizeForSearch("moler, gleter.")).toBe("moler gleter");
  });

  it("čuva cifre — pojavljuju se u opisima usluga", () => {
    expect(normalizeForSearch("gletovanje 2 sloja")).toBe("gletovanje 2 sloja");
  });

  /* Dvoslovni prevodi ne smeju da se slepe sa susednim tekstom. */
  it("њ i џ prevodi u dva znaka", () => {
    expect(normalizeForSearch("њива")).toBe("njiva");
    expect(normalizeForSearch("џак")).toBe("dzak");
  });

  it("ne puca na prazan unos", () => {
    expect(normalizeForSearch("")).toBe("");
    expect(normalizeForSearch("   ")).toBe("");
  });
});

describe("toCyrillic", () => {
  it("prevodi obične reči", () => {
    expect(toCyrillic("Moler")).toBe("Молер");
    expect(toCyrillic("vodoinstalater")).toBe("водоинсталатер");
  });

  /* Digrafi moraju pre pojedinačnih slova, inače „nj" postane „нј". */
  it.each([
    ["konj", "коњ"],
    ["Njegoš", "Његош"],
    ["ljubav", "љубав"],
    ["džak", "џак"],
    ["LJUBAV", "ЉУБАВ"],
  ])("digraf: %s → %s", (latn, cyrl) => {
    expect(toCyrillic(latn)).toBe(cyrl);
  });

  /*
   * Reči u kojima „nj" nisu jedan glas nego dva. Bez ovoga „injekcija" postane
   * „ињекција", što je pogrešno.
   */
  it.each([
    ["injekcija", "инјекција"],
    ["nadživeti", "надживети"],
  ])("izuzetak: %s → %s", (latn, cyrl) => {
    expect(toCyrillic(latn)).toBe(cyrl);
  });

  /*
   * Kontrolni primer za izuzetke: „nadž" je izuzetak zato što tu „d" i „ž" nisu
   * digraf. Provera da izuzetak nije slučajno pregazio i običan „dž".
   */
  it("običan dž i dalje prolazi kao digraf", () => {
    expect(toCyrillic("džak")).toBe("џак");
    expect(toCyrillic("nadživeti")).not.toContain("џ");
  });

  it("ne dira cifre i interpunkciju", () => {
    expect(toCyrillic("Moler, 2 sloja.")).toBe("Молер, 2 слоја.");
  });
});

describe("toSlug", () => {
  it.each([
    ["Keramičar", "keramicar"],
    ["Građevinski radovi", "gradjevinski-radovi"],
    ["Žitorađa", "zitoradja"],
    ["Petar Petrović", "petar-petrovic"],
    ["Novi   Sad", "novi-sad"],
    ["  Čačak  ", "cacak"],
  ])("%s → %s", (ulaz, izlaz) => {
    expect(toSlug(ulaz)).toBe(izlaz);
  });

  /* Slug ide u URL — ništa osim malih slova, cifara i crtice ne sme da prođe. */
  it.each(["Moler & Gleter", "Cene (2024)!", "a/b?c=d", "Šta—sad"])(
    "izbacuje sve što ne sme u URL: %s",
    (ulaz) => {
      expect(toSlug(ulaz)).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    },
  );

  it("ne ostavlja crticu na početku ni na kraju", () => {
    expect(toSlug("!!! moler !!!")).toBe("moler");
  });
});
