import { describe, expect, it } from "vitest";

import { adresaIzForme, upitIzForme } from "./upit";

/**
 * Gradnja upita iz forme.
 *
 * Tiha greška ovde ne ruši ništa — samo napravi drugu adresu za istu stranicu.
 * Za sajt kome je pretraživač glavni izvor posetilaca to je najskuplja vrsta
 * greške: primeti se mesecima kasnije, kroz pad u rezultatima.
 */
function forma(parovi: [string, string][]): FormData {
  const fd = new FormData();
  for (const [k, v] of parovi) fd.append(k, v);
  return fd;
}

describe("upit iz forme", () => {
  it("prazna forma daje prazan upit", () => {
    expect(upitIzForme(forma([]))).toBe("");
  });

  it("prazne vrednosti ispadaju", () => {
    expect(upitIzForme(forma([["grad", ""]]))).toBe("");
    expect(upitIzForme(forma([["q", ""], ["grad", "beograd"]]))).toBe("grad=beograd");
  });

  it("zadržava redosled polja iz forme", () => {
    expect(upitIzForme(forma([["q", "moler"], ["grad", "beograd"]]))).toBe("q=moler&grad=beograd");
  });

  it("ponovljena polja se skupljaju, ne prepisuju", () => {
    const upit = upitIzForme(forma([["usluga", "gletovanje"], ["usluga", "krecenje"]]));
    expect(upit).toBe("usluga=gletovanje&usluga=krecenje");
  });

  it("kodira razmake i dijakritiku", () => {
    const upit = upitIzForme(forma([["q", "moler Čačak"]]));
    expect(upit).toBe("q=moler+%C4%8Ca%C4%8Dak");
    expect(new URLSearchParams(upit).get("q")).toBe("moler Čačak");
  });

  it("kodira znake koji bi inače razbili upit", () => {
    const upit = upitIzForme(forma([["q", "a&b=c"]]));
    expect(new URLSearchParams(upit).get("q")).toBe("a&b=c");
  });
});

describe("adresa iz forme", () => {
  it("bez ijednog filtera vraća čistu putanju, bez upitnika", () => {
    expect(adresaIzForme("/moleri", forma([["grad", ""]]))).toBe("/moleri");
  });

  it("sa filterima lepi upit na putanju", () => {
    expect(adresaIzForme("/moleri", forma([["grad", "beograd"]]))).toBe("/moleri?grad=beograd");
  });

  it("koren ostaje koren", () => {
    expect(adresaIzForme("/", forma([]))).toBe("/");
  });
});
