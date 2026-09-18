import { describe, expect, it } from "vitest";

import { kljucFiltera } from "./kljuc";

/**
 * Ključ forme filtera.
 *
 * Ovo je jedina stvar koja stoji između „Poništi filtere" i kvačice koja ostaje
 * na ekranu pošto je iz adrese nestala. Greška se ne vidi ni u tipovima ni u
 * build-u — samo na ekranu, i to tek posle druge navigacije.
 */
const PRAZNO = { kategorija: null, grad: null };

describe("ključ filtera", () => {
  it("prazno stanje daje isti ključ svaki put", () => {
    expect(kljucFiltera({}, PRAZNO)).toBe(kljucFiltera({}, PRAZNO));
  });

  it("primenjen filter menja ključ u odnosu na prazno", () => {
    expect(kljucFiltera({ ocena: ["5"] }, PRAZNO)).not.toBe(kljucFiltera({}, PRAZNO));
  });

  /** Baš slučaj iz prijave: sa `/?ocena=5` na `/`. */
  it("uklanjanje filtera vraća ključ na onaj praznog stanja", () => {
    const sa = kljucFiltera({ ocena: ["5"], verifikovani: "1" }, PRAZNO);
    const bez = kljucFiltera({}, PRAZNO);
    expect(sa).not.toBe(bez);
    expect(kljucFiltera({}, PRAZNO)).toBe(bez);
  });

  it("redosled vrednosti u adresi ne pravi novi ključ", () => {
    expect(kljucFiltera({ usluga: ["a", "b"] }, PRAZNO)).toBe(
      kljucFiltera({ usluga: ["b", "a"] }, PRAZNO),
    );
  });

  it("prazan niz i izostavljena vrednost su isto stanje", () => {
    expect(kljucFiltera({ ocena: [] }, PRAZNO)).toBe(kljucFiltera({}, PRAZNO));
  });

  it("kategorija iz putanje ulazi u ključ", () => {
    expect(kljucFiltera({}, { kategorija: "moleri", grad: null })).not.toBe(
      kljucFiltera({}, PRAZNO),
    );
  });

  it("grad iz putanje ulazi u ključ", () => {
    expect(kljucFiltera({}, { kategorija: "moleri", grad: "beograd" })).not.toBe(
      kljucFiltera({}, { kategorija: "moleri", grad: null }),
    );
  });

  it.each([
    ["usluga", { usluga: ["krecenje"] }],
    ["grad", { grad: "nis" }],
    ["cenaOd", { cenaOd: "500" }],
    ["cenaDo", { cenaDo: "5000" }],
    ["ocena", { ocena: ["4"] }],
    ["verifikovani", { verifikovani: "1" }],
    ["q", { q: "moler" }],
  ])("izmena polja „%s\" pravi novi ključ", (_naziv, vrednosti) => {
    expect(kljucFiltera(vrednosti, PRAZNO)).not.toBe(kljucFiltera({}, PRAZNO));
  });

  it("dva različita filtera ne daju isti ključ", () => {
    expect(kljucFiltera({ cenaOd: "1" }, PRAZNO)).not.toBe(kljucFiltera({ cenaDo: "1" }, PRAZNO));
  });

  it("ne meša vrednosti susednih polja", () => {
    /* Bez razdvajanja bi „ab" + "" i „a" + „b" dali isti niz znakova. */
    expect(kljucFiltera({ cenaOd: "ab", cenaDo: "" }, PRAZNO)).not.toBe(
      kljucFiltera({ cenaOd: "a", cenaDo: "b" }, PRAZNO),
    );
  });
});
