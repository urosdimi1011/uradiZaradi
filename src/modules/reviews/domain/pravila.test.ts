import { describe, expect, it } from "vitest";

import {
  PRAG_MODERACIJE,
  TEKST_NAJMANJE,
  pocetniStatus,
  recenzijaSchema,
  smeDaOceni,
  ocenaIzUpita,
} from "./pravila";

/**
 * Pravila za recenzije.
 *
 * Recenzije su jedini deo sajta koji piše neko drugi i koji direktno utiče na
 * to da li će majstor dobiti posao. Greška ovde ne pukne — samo pusti lažnu
 * ocenu ili zaustavi pravu.
 */

const ispravna = {
  rating: 5,
  body: "Došao je isti dan, sve objasnio unapred i posao završio bez ijedne primedbe.",
  serviceTypeId: "",
};

describe("ocena", () => {
  it.each([1, 2, 3, 4, 5])("prihvata %d", (rating) => {
    expect(recenzijaSchema.safeParse({ ...ispravna, rating }).success).toBe(true);
  });

  it.each([0, 6, -1, 2.5, Number.NaN])("odbija %s", (rating) => {
    expect(recenzijaSchema.safeParse({ ...ispravna, rating }).success).toBe(false);
  });
});

describe("tekst", () => {
  /*
   * „Sve top" nije recenzija. Kratak tekst ne govori ništa sledećem kupcu, a
   * lažne ocene su po pravilu kratke.
   */
  it("odbija prekratak tekst", () => {
    expect(recenzijaSchema.safeParse({ ...ispravna, body: "Sve top" }).success).toBe(false);
  });

  it("prihvata tekst tačno na granici", () => {
    const body = "a".repeat(TEKST_NAJMANJE);
    expect(recenzijaSchema.safeParse({ ...ispravna, body }).success).toBe(true);
  });

  it("odbija predugačak tekst", () => {
    expect(recenzijaSchema.safeParse({ ...ispravna, body: "a".repeat(2000) }).success).toBe(false);
  });

  it("seče razmake pre merenja dužine", () => {
    const r = recenzijaSchema.safeParse({ ...ispravna, body: `   ${"a".repeat(10)}   ` });
    expect(r.success).toBe(false);
  });

  it("prazna usluga postaje null", () => {
    const r = recenzijaSchema.safeParse({ ...ispravna, serviceTypeId: "  " });
    expect(r.success && r.data.serviceTypeId).toBeNull();
  });
});

describe("asimetrična moderacija", () => {
  /*
   * Srž celog sistema: zadovoljan kupac ne čeka ništa, a ono što pravi štetu
   * pregleda čovek.
   */
  it.each([4, 5])("ocena %d se objavljuje odmah", (rating) => {
    expect(pocetniStatus(rating)).toBe("PUBLISHED");
  });

  it.each([1, 2, 3])("ocena %d čeka moderaciju", (rating) => {
    expect(pocetniStatus(rating)).toBe("PENDING");
  });

  it("prag je u granicama ocene", () => {
    expect(PRAG_MODERACIJE).toBeGreaterThanOrEqual(1);
    expect(PRAG_MODERACIJE).toBeLessThan(5);
  });

  /* Negativna se NIKAD ne odbacuje sama — samo se odlaže do odluke čoveka. */
  it.each([1, 2, 3, 4, 5])("ocena %d nikad ne ide direktno u REJECTED", (rating) => {
    expect(pocetniStatus(rating)).not.toBe("REJECTED");
  });
});

describe("ko sme da oceni", () => {
  const osnova = {
    korisnikId: "usr_1",
    majstorUserId: "usr_9",
    majstorStatus: "ACTIVE",
    vecOcenio: false,
  };

  it("prijavljen korisnik sme", () => {
    expect(smeDaOceni(osnova)).toEqual({ sme: true });
  });

  it("gost ne sme", () => {
    expect(smeDaOceni({ ...osnova, korisnikId: null })).toEqual({
      sme: false,
      razlog: "nije-prijavljen",
    });
  });

  /* Najlenja zloupotreba — majstor sebi piše peticu. */
  it("majstor ne sme sebe", () => {
    expect(smeDaOceni({ ...osnova, korisnikId: "usr_9" })).toEqual({
      sme: false,
      razlog: "sam-svoj",
    });
  });

  it("ne sme dvaput istog majstora", () => {
    expect(smeDaOceni({ ...osnova, vecOcenio: true })).toEqual({
      sme: false,
      razlog: "vec-ocenio",
    });
  });

  it.each(["DRAFT", "PENDING_REVIEW", "SUSPENDED", "BANNED"])(
    "neobjavljen profil (%s) se ne ocenjuje",
    (majstorStatus) => {
      expect(smeDaOceni({ ...osnova, majstorStatus })).toEqual({
        sme: false,
        razlog: "nije-objavljen",
      });
    },
  );

  /*
   * Redosled provera je bitan: gostu se traži prijava, a ne „već ste ocenili".
   * Poruka mora da odgovara prvom razlogu koji ga zaustavlja.
   */
  it("gost koji je nekako i sam svoj majstor dobija poruku o prijavi", () => {
    const r = smeDaOceni({ ...osnova, korisnikId: null, vecOcenio: true });
    expect(r.sme === false && r.razlog).toBe("nije-prijavljen");
  });
});

/**
 * Ocena iz adrese.
 *
 * Ulaz piše korisnik — ovo je granica između njegove adrese i forme koja se
 * otvara sa već izabranom vrednošću.
 */
describe("ocena iz upita", () => {
  it.each([1, 2, 3, 4, 5])("prihvata %d", (n) => {
    expect(ocenaIzUpita(String(n))).toBe(n);
  });

  it.each(["0", "6", "-1", "100"])("odbija %s kao van opsega", (v) => {
    expect(ocenaIzUpita(v)).toBe(0);
  });

  it.each(["3.5", "abc", "", "   ", "4a", "١"])("odbija „%s\" kao neispravno", (v) => {
    expect(ocenaIzUpita(v)).toBe(0);
  });

  it("odbija sve što nije tekst", () => {
    expect(ocenaIzUpita(undefined)).toBe(0);
    expect(ocenaIzUpita(null)).toBe(0);
    expect(ocenaIzUpita(4)).toBe(0);
    expect(ocenaIzUpita(["4"])).toBe(0);
  });
});
