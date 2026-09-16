import { describe, expect, it } from "vitest";

import { PATTERNS, signInSchema, signUpSchema } from "./auth";

/**
 * Pravila prijave i registracije.
 *
 * Ovo su testovi koji stvarno vrede: greška u ovim izrazima ne obori ništa —
 * samo tiho odbije ili tiho propusti korisnika. „Đorđe" koji ne može da se
 * registruje niko neće prijaviti, samo će otići.
 */

const ispravnaRegistracija = {
  name: "Petar Petrović",
  email: "petar@primer.rs",
  password: "lozinka123",
  uloga: "USER",
};

describe("signUpSchema — ime", () => {
  it.each([
    ["obično ime", "Petar Petrović"],
    ["sva naša slova", "Đorđe Šćepanović"],
    ["dvostruko prezime", "Ana Marić-Jovanović"],
    ["apostrof", "D'Angelo Perić"],
    ["ćirilica", "Ана Јовановић"],
  ])("prihvata %s", (_, name) => {
    expect(signUpSchema.safeParse({ ...ispravnaRegistracija, name }).success).toBe(true);
  });

  it.each([
    ["cifre u imenu", "Pera123"],
    ["HTML", "<script>alert(1)</script>"],
    ["jedno slovo", "P"],
    ["prazno", ""],
    ["samo razmaci", "   "],
    ["počinje crticom", "-Pera"],
  ])("odbija %s", (_, name) => {
    expect(signUpSchema.safeParse({ ...ispravnaRegistracija, name }).success).toBe(false);
  });

  it("seče razmake sa strane", () => {
    const r = signUpSchema.safeParse({ ...ispravnaRegistracija, name: "  Petar Petrović  " });
    expect(r.success && r.data.name).toBe("Petar Petrović");
  });
});

describe("signUpSchema — e-pošta", () => {
  it.each([
    "pera@gmail.com",
    "pera.peric@co.rs",
    "a@b.co",
    "pera+oglasi@gmail.com",
    "pera@sub.domen.co.uk",
  ])("prihvata %s", (email) => {
    expect(signUpSchema.safeParse({ ...ispravnaRegistracija, email }).success).toBe(true);
  });

  it.each(["pera@", "@b.com", "pera @gmail.com", "pera@gmail", "pera", "pera@@gmail.com"])(
    "odbija %s",
    (email) => {
      expect(signUpSchema.safeParse({ ...ispravnaRegistracija, email }).success).toBe(false);
    },
  );

  /*
   * Bez ovoga `Pera@Gmail.com` i `pera@gmail.com` postaju dva naloga, a
   * korisnik ne zna kojim se registrovao.
   */
  it("pretvara u mala slova i seče razmake", () => {
    const r = signUpSchema.safeParse({
      ...ispravnaRegistracija,
      email: "  MILA.Jovanovic@Primer.RS ",
    });
    expect(r.success && r.data.email).toBe("mila.jovanovic@primer.rs");
  });
});

describe("signUpSchema — lozinka", () => {
  it.each([
    ["slovo i cifra", "lozinka123"],
    ["veliko slovo nije obavezno ali je dozvoljeno", "Lozinka1"],
    ["naša slova", "Šifra2024"],
    ["tačno 8 znakova", "lozinka1"],
  ])("prihvata %s", (_, password) => {
    expect(signUpSchema.safeParse({ ...ispravnaRegistracija, password }).success).toBe(true);
  });

  it.each([
    ["bez cifre", "lozinkaaa"],
    ["bez slova", "12345678"],
    ["prekratku", "loz1"],
    ["sa razmakom", "loz inka1"],
  ])("odbija %s", (_, password) => {
    expect(signUpSchema.safeParse({ ...ispravnaRegistracija, password }).success).toBe(false);
  });

  /* Neki algoritmi za heširanje tiho odsecaju predugačak ulaz — bolje odbiti. */
  it("odbija lozinku dužu od 128 znakova", () => {
    const password = `a1${"x".repeat(200)}`;
    expect(signUpSchema.safeParse({ ...ispravnaRegistracija, password }).success).toBe(false);
  });
});

describe("signUpSchema — uloga", () => {
  it("prihvata USER i MAJSTOR", () => {
    for (const uloga of ["USER", "MAJSTOR"]) {
      const r = signUpSchema.safeParse({ ...ispravnaRegistracija, uloga });
      expect(r.success && r.data.uloga).toBe(uloga);
    }
  });

  /*
   * Ovo je bezbednosni test, ne test udobnosti. Forma nudi dve uloge; sve
   * ostalo mora da postane USER, jer bi inače POST sa `uloga=ADMIN` napravio
   * administratora.
   */
  it.each([["ADMIN"], ["administrator"], [""], [undefined], [null], [42]])(
    "pretvara %s u USER",
    (uloga) => {
      const r = signUpSchema.safeParse({ ...ispravnaRegistracija, uloga });
      expect(r.success && r.data.uloga).toBe("USER");
    },
  );
});

describe("signInSchema", () => {
  it("traži samo da polja nisu prazna", () => {
    expect(signInSchema.safeParse({ email: "pera@gmail.com", password: "x" }).success).toBe(true);
  });

  /*
   * Namerno NE primenjuje pravila o jačini lozinke. Kad se pravilo pooštri,
   * korisnici sa starijim lozinkama moraju i dalje da mogu da se prijave.
   */
  it("prihvata staru slabu lozinku", () => {
    expect(signInSchema.safeParse({ email: "pera@gmail.com", password: "abc" }).success).toBe(true);
  });

  it("prihvata mejl koji registracija ne bi primila", () => {
    expect(signInSchema.safeParse({ email: "staro@lokalno", password: "abc" }).success).toBe(true);
  });

  it.each([
    [{ email: "", password: "abc" }],
    [{ email: "pera@gmail.com", password: "" }],
    [{ email: "   ", password: "abc" }],
  ])("odbija prazno polje: %o", (ulaz) => {
    expect(signInSchema.safeParse(ulaz).success).toBe(false);
  });
});

/**
 * `pattern` atribut se u pretraživaču kompajlira sa `v` zastavicom, koja je
 * strožija od `u` — neki znakovi tamo moraju da budu izbegnuti. Ako izraz nije
 * ispravan po `v` pravilima, pretraživač ga tiho ignoriše i provera nestaje,
 * a niko to ne primeti dok neko ne pošalje đubre kroz formu.
 */
describe("PATTERNS — upotrebljivi kao HTML pattern atribut", () => {
  it.each(Object.entries(PATTERNS))("%s se kompajlira sa v zastavicom", (_, izraz) => {
    expect(() => new RegExp(izraz, "v")).not.toThrow();
  });

  /* Server seče razmake, pretraživač ne — atribut mora da ih trpi, inače
     korisnik dobija grešku za nešto što server uredno prihvata. */
  it.each([
    ["email", "  pera@gmail.com  "],
    ["name", "  Petar Petrović  "],
  ] as const)("%s trpi razmake sa strane", (polje, vrednost) => {
    expect(new RegExp(`^(?:${PATTERNS[polje]})$`, "v").test(vrednost)).toBe(true);
  });

  /* Lozinka se NE seče — razmak je njen legitiman deo, pa je ne smemo menjati. */
  it("password ne trpi razmake", () => {
    expect(new RegExp(`^(?:${PATTERNS.password})$`, "v").test(" lozinka123 ")).toBe(false);
  });
});
