import { describe, expect, it } from "vitest";

import { cenaZaUnos, NAJVECA_CENA_RSD, parsirajCenu } from "./cena";

/**
 * Cene.
 *
 * Greška ovde ne pukne — samo upiše pogrešan broj. Majstor koji kuca „1.500"
 * a u bazu uđe 150.000 para (1.500 dinara ✓) ili 150 para (1,5 dinar ✗) neće
 * to primetiti dok ga neko ne pozove i pita zašto radi za dinar i po.
 */

describe("parsirajCenu — srpski zapis", () => {
  /*
   * Srpski koristi TAČKU za hiljade i ZAREZ za decimale — obrnuto od engleskog.
   * `parseFloat("1.500")` bi dao 1.5, pa je ovo srž celog modula.
   */
  it.each([
    ["1500", 150_000],
    ["1.500", 150_000],
    ["1 500", 150_000],
    ["1500,00", 150_000],
    ["1.500,00", 150_000],
    ["1.872", 187_200],
    ["12.500", 1_250_000],
    ["1.500,50", 150_050],
    ["1500,5", 150_050],
  ])("%s → %d para", (unos, ocekivano) => {
    expect(parsirajCenu(unos)).toBe(ocekivano);
  });

  it("svi zapisi iste cene daju isti broj", () => {
    const zapisi = ["1500", "1.500", "1 500", "1500,00", "1.500,00"];
    expect(new Set(zapisi.map(parsirajCenu)).size).toBe(1);
  });

  /* Kopiranje iz Excela ubacuje razmak bez preloma umesto običnog. */
  it("trpi razmak bez preloma", () => {
    expect(parsirajCenu("1 500")).toBe(150_000);
  });

  it("seče razmake sa strane", () => {
    expect(parsirajCenu("  1500  ")).toBe(150_000);
  });
});

describe("parsirajCenu — prazno znači „po dogovoru”", () => {
  it.each(["", "   "])("%s → null", (unos) => {
    expect(parsirajCenu(unos)).toBeNull();
  });
});

describe("parsirajCenu — šta se odbija", () => {
  /* `undefined` znači „nije broj" i razlikuje se od `null` koji znači „prazno". */
  it.each([
    ["slova", "po dogovoru"],
    ["broj sa slovima", "1500rsd"],
    ["valuta u polju", "1500 RSD"],
    ["negativno", "-1500"],
    ["nula", "0"],
    ["samo znakovi", ".,"],
    ["dva zareza", "1,5,5"],
    ["ubačeni sadržaj", "1500<script>"],
  ])("odbija %s", (_, unos) => {
    expect(parsirajCenu(unos)).toBeUndefined();
  });

  /* Gornja granica hvata prekucavanje — niko ne naplaćuje 50 miliona po kvadratu. */
  it("odbija iznos preko granice", () => {
    expect(parsirajCenu(String(NAJVECA_CENA_RSD + 1))).toBeUndefined();
  });

  it("prihvata tačno granicu", () => {
    expect(parsirajCenu(String(NAJVECA_CENA_RSD))).toBe(NAJVECA_CENA_RSD * 100);
  });
});

describe("parsirajCenu — tačka kao jedini znak", () => {
  /*
   * „1.500" je dvosmisleno. Pravilo: tri cifre posle tačke znače hiljade.
   * Niko nikad nije mislio da je „1.500" dinar i po.
   */
  it.each([
    ["1.500", 150_000],
    ["25.000", 2_500_000],
  ])("%s je hiljade → %d", (unos, ocekivano) => {
    expect(parsirajCenu(unos)).toBe(ocekivano);
  });

  it.each([
    ["1.5", 150],
    ["18.72", 1872],
  ])("%s je decimala → %d", (unos, ocekivano) => {
    expect(parsirajCenu(unos)).toBe(ocekivano);
  });
});

describe("zaokruživanje", () => {
  /*
   * `18.72 * 100` u pokretnom zarezu daje 1871.9999999999998. Bez zaokruživanja
   * bi u bazu ušlo 1871 para umesto 1872 — greška od jedne pare po cени, koja
   * se u zbiru vidi.
   */
  it.each([
    ["18,72", 1872],
    ["0,07", 7],
    ["10,10", 1010],
    ["1234,56", 123_456],
  ])("%s → %d para bez greške u zarezu", (unos, ocekivano) => {
    expect(parsirajCenu(unos)).toBe(ocekivano);
  });
});

describe("cenaZaUnos", () => {
  it.each([
    [187_200, "1872"],
    [150_000, "1500"],
    [150_050, "1500,50"],
    [null, ""],
    [undefined, ""],
  ])("%s → %s", (minor, ocekivano) => {
    expect(cenaZaUnos(minor)).toBe(ocekivano);
  });

  /* Prikaz i parsiranje moraju da budu obrnute operacije. */
  it.each([187_200, 150_000, 150_050, 7])("%d preživi krug prikaz → unos", (minor) => {
    expect(parsirajCenu(cenaZaUnos(minor))).toBe(minor);
  });
});
