import { describe, expect, it } from "vitest";

import {
  imaLozinku,
  posledicaStatusa,
  smeDaMenjaSlug,
  smeDaObriseKategoriju,
  smeDaObriseUslugu,
  smeNadKorisnikom,
} from "./pravila";

/**
 * Pravila administracije.
 *
 * Ovo su jedine provere koje stoje između jednog pogrešnog klika i podataka
 * koji se ne vraćaju. Testovi su ovde zato što se komponenta može prepraviti,
 * a pravilo mora da preživi prepravku.
 */
describe("brisanje kategorije", () => {
  it("prazna kategorija sme da se obriše", () => {
    expect(smeDaObriseKategoriju({ brojMajstora: 0, brojUsluga: 0 })).toEqual({ sme: true });
  });

  it("kategorija sa majstorima ne sme — adresa je u Google-u", () => {
    expect(smeDaObriseKategoriju({ brojMajstora: 1, brojUsluga: 0 })).toEqual({
      sme: false,
      razlog: "ima-majstore",
    });
  });

  it("kategorija sa uslugama ne sme ni kad nema majstore", () => {
    expect(smeDaObriseKategoriju({ brojMajstora: 0, brojUsluga: 3 })).toEqual({
      sme: false,
      razlog: "ima-usluge",
    });
  });

  it("majstori su jači razlog od usluga — prvi se javlja", () => {
    expect(smeDaObriseKategoriju({ brojMajstora: 2, brojUsluga: 5 })).toEqual({
      sme: false,
      razlog: "ima-majstore",
    });
  });
});

describe("brisanje usluge", () => {
  it("usluga koju niko ne nudi sme da se obriše", () => {
    expect(smeDaObriseUslugu({ brojMajstora: 0 })).toEqual({ sme: true });
  });

  it("usluga u nečijem cenovniku ne sme", () => {
    expect(smeDaObriseUslugu({ brojMajstora: 1 })).toEqual({
      sme: false,
      razlog: "ima-majstore",
    });
  });
});

describe("izmena sluga", () => {
  it("nova stavka sme da dobije slug", () => {
    expect(smeDaMenjaSlug({ postoji: false })).toBe(true);
  });

  it("postojeća ne sme — to je adresa koju Google već ima", () => {
    expect(smeDaMenjaSlug({ postoji: true })).toBe(false);
  });
});

describe("radnje nad korisnikom", () => {
  const akter = "admin-1";

  it("običan korisnik sme da se menja", () => {
    expect(
      smeNadKorisnikom({ akterId: akter, metaId: "u-1", metaUloga: "USER", brojAdmina: 2 }),
    ).toEqual({ sme: true });
  });

  it("majstor sme da se menja", () => {
    expect(
      smeNadKorisnikom({ akterId: akter, metaId: "m-1", metaUloga: "MAJSTOR", brojAdmina: 1 }),
    ).toEqual({ sme: true });
  });

  it("niko ne dira sam sebe", () => {
    expect(
      smeNadKorisnikom({ akterId: akter, metaId: akter, metaUloga: "ADMIN", brojAdmina: 5 }),
    ).toEqual({ sme: false, razlog: "sam-sebi" });
  });

  it("sopstveni nalog je zaštićen i kad uloga nije ADMIN", () => {
    expect(
      smeNadKorisnikom({ akterId: akter, metaId: akter, metaUloga: "USER", brojAdmina: 5 }),
    ).toEqual({ sme: false, razlog: "sam-sebi" });
  });

  it("admin ne dira drugog admina", () => {
    expect(
      smeNadKorisnikom({ akterId: akter, metaId: "admin-2", metaUloga: "ADMIN", brojAdmina: 3 }),
    ).toEqual({ sme: false, razlog: "nad-adminom" });
  });

  it("poslednji admin se prepoznaje kao poseban slučaj", () => {
    expect(
      smeNadKorisnikom({ akterId: akter, metaId: "admin-2", metaUloga: "ADMIN", brojAdmina: 1 }),
    ).toEqual({ sme: false, razlog: "poslednji-admin" });
  });
});

describe("posledice statusa", () => {
  it("aktivan nalog ne trpi ništa", () => {
    expect(posledicaStatusa("ACTIVE")).toEqual({
      skloniProfil: false,
      skloniRecenzije: false,
      prekiniSesije: false,
    });
  });

  it("suspenzija sklanja profil i odjavljuje, ali ostavlja recenzije", () => {
    expect(posledicaStatusa("SUSPENDED")).toEqual({
      skloniProfil: true,
      skloniRecenzije: false,
      prekiniSesije: true,
    });
  });

  it("ban sklanja i recenzije", () => {
    expect(posledicaStatusa("BANNED")).toEqual({
      skloniProfil: true,
      skloniRecenzije: true,
      prekiniSesije: true,
    });
  });

  it("svaki status koji sklanja profil mora i da odjavi", () => {
    for (const status of ["ACTIVE", "SUSPENDED", "BANNED"] as const) {
      const p = posledicaStatusa(status);
      if (p.skloniProfil) expect(p.prekiniSesije).toBe(true);
    }
  });
});

describe("da li nalog ima lozinku kod nas", () => {
  it("prijava mejlom i lozinkom ima", () => {
    expect(imaLozinku({ provideri: ["credential"] })).toBe(true);
  });

  it("samo Google nema — nema šta da se resetuje", () => {
    expect(imaLozinku({ provideri: ["google"] })).toBe(false);
  });

  it("nalog sa oba načina ima", () => {
    expect(imaLozinku({ provideri: ["google", "credential"] })).toBe(true);
  });

  it("nalog bez ijednog načina nema", () => {
    expect(imaLozinku({ provideri: [] })).toBe(false);
  });
});
