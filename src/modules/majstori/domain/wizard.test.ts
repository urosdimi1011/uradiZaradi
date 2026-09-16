import { describe, expect, it } from "vitest";

import { jeKorak, korak1Schema, KORACI, NAJVISE_DODATNIH_ZANATA, PATTERNS } from "./wizard";

const ispravan = {
  displayName: "Petar Petrović",
  phone: "064 123 4567",
  primaryCategoryId: "cat_1",
  cityId: "city_1",
  municipalityId: "",
};

describe("korak 1 — ime", () => {
  it.each([
    ["lično ime", "Petar Petrović"],
    ["naša slova", "Đorđe Šćepanović"],
    ["dvostruko prezime", "Ana Marić-Jovanović"],
    ["naziv radnje", "Moleraj Petrović"],
    ["radnja sa brojem", "Termo 021"],
    ["radnja sa ampersandom", "Petrović & sinovi"],
    ["ćirilica", "Петар Петровић"],
  ])("prihvata %s", (_, displayName) => {
    expect(korak1Schema.safeParse({ ...ispravan, displayName }).success).toBe(true);
  });

  it.each([
    ["prekratko", "P"],
    ["prazno", ""],
    ["samo razmaci", "   "],
    ["HTML", "<script>alert(1)</script>"],
  ])("odbija %s", (_, displayName) => {
    expect(korak1Schema.safeParse({ ...ispravan, displayName }).success).toBe(false);
  });

  it("seče razmake sa strane", () => {
    const r = korak1Schema.safeParse({ ...ispravan, displayName: "  Petar Petrović  " });
    expect(r.success && r.data.displayName).toBe("Petar Petrović");
  });
});

describe("korak 1 — telefon", () => {
  /*
   * Ključno: bez obzira kako je otkucan, u bazu ulazi jedan isti zapis. Telefon
   * je `@unique` i jedina prepreka pravljenju više profila.
   */
  it.each(["0641234567", "064 123 4567", "064/123-4567", "+381641234567", "00381641234567"])(
    "%s se svodi na kanonski oblik",
    (phone) => {
      const r = korak1Schema.safeParse({ ...ispravan, phone });
      expect(r.success && r.data.phone).toBe("+381641234567");
    },
  );

  it.each([
    ["prazno", ""],
    ["slova", "zovi me"],
    ["prekratko", "064123"],
    ["strani broj", "+3859112345678"],
  ])("odbija %s", (_, phone) => {
    expect(korak1Schema.safeParse({ ...ispravan, phone }).success).toBe(false);
  });

  it("poruka o grešci objašnjava oblik", () => {
    const r = korak1Schema.safeParse({ ...ispravan, phone: "zovi me" });
    expect(r.success).toBe(false);
    const poruke = r.success ? [] : r.error.issues.map((i) => i.message);
    expect(poruke.join(" ")).toContain("064 123 4567");
  });
});

describe("korak 1 — lokacija i zanat", () => {
  it.each(["primaryCategoryId", "cityId"] as const)("%s je obavezan", (polje) => {
    expect(korak1Schema.safeParse({ ...ispravan, [polje]: "" }).success).toBe(false);
  });

  /*
   * Deo grada postoji samo u četiri grada. Prazan `<select>` mora da postane
   * `null`, jer bi prazan string u bazi bio strani ključ koji ne pokazuje nigde.
   */
  it.each([
    ["prazan string", "", null],
    ["samo razmaci", "   ", null],
    ["izabran deo", "mun_5", "mun_5"],
  ])("deo grada: %s → %s", (_, ulaz, ocekivano) => {
    const r = korak1Schema.safeParse({ ...ispravan, municipalityId: ulaz });
    expect(r.success && r.data.municipalityId).toBe(ocekivano);
  });
});

describe("korak 1 — dodatni zanati", () => {
  /*
   * Majstor koji radi samo jedno je izuzetak, ali mora da prođe bez ijedne
   * čekirane kućice — a tada forma to polje uopšte ne šalje.
   */
  it("prolazi bez ijednog dodatnog zanata", () => {
    const r = korak1Schema.safeParse(ispravan);
    expect(r.success && r.data.dodatneKategorije).toEqual([]);
  });

  it("prihvata više zanata", () => {
    const r = korak1Schema.safeParse({ ...ispravan, dodatneKategorije: ["cat_2", "cat_3"] });
    expect(r.success && r.data.dodatneKategorije).toEqual(["cat_2", "cat_3"]);
  });

  /*
   * Gornja granica nije estetika: majstor koji čekira svih devet zanata nije
   * majstor nego oglas, a u pretrazi bi se pojavljivao svuda.
   */
  it(`odbija više od ${NAJVISE_DODATNIH_ZANATA}`, () => {
    const previse = Array.from({ length: NAJVISE_DODATNIH_ZANATA + 1 }, (_, i) => `cat_${i + 2}`);
    expect(korak1Schema.safeParse({ ...ispravan, dodatneKategorije: previse }).success).toBe(false);
  });

  it(`prihvata tačno ${NAJVISE_DODATNIH_ZANATA}`, () => {
    const tacno = Array.from({ length: NAJVISE_DODATNIH_ZANATA }, (_, i) => `cat_${i + 2}`);
    expect(korak1Schema.safeParse({ ...ispravan, dodatneKategorije: tacno }).success).toBe(true);
  });

  it("odbija prazan id u spisku", () => {
    expect(korak1Schema.safeParse({ ...ispravan, dodatneKategorije: [""] }).success).toBe(false);
  });
});

describe("koraci čarobnjaka", () => {
  it("segmenti su jedinstveni i bezbedni za URL", () => {
    const segmenti = KORACI.map((k) => k.segment);
    expect(new Set(segmenti).size).toBe(segmenti.length);
    for (const segment of segmenti) expect(segment).toMatch(/^[a-z]+$/);
  });

  it("prvi korak je zanat — on jedini kreira profil", () => {
    expect(KORACI[0]?.segment).toBe("zanat");
  });

  /* Čuva od otvorenog preusmeravanja kroz segment iz adrese. */
  it.each(["zanat", "usluge", "profil", "objava"])("prepoznaje korak %s", (segment) => {
    expect(jeKorak(segment)).toBe(true);
  });

  it.each(["", "admin", "../../etc", "ZANAT", "https://zlo.rs"])(
    "odbija %s kao korak",
    (segment) => {
      expect(jeKorak(segment)).toBe(false);
    },
  );
});

describe("PATTERNS — upotrebljivi kao HTML pattern atribut", () => {
  it.each(Object.entries(PATTERNS))("%s se kompajlira sa v zastavicom", (_, izraz) => {
    expect(() => new RegExp(izraz, "v")).not.toThrow();
  });

  /* Server seče razmake, pretraživač ne — atribut mora da ih trpi. */
  it("ime trpi razmake sa strane", () => {
    expect(new RegExp(`^(?:${PATTERNS.ime})$`, "v").test("  Petar Petrović  ")).toBe(true);
  });

  it.each(["064 123 4567", "064/123-4567", "+381641234567", "0641234567"])(
    "telefon %s prolazi kroz pattern",
    (unos) => {
      expect(new RegExp(`^(?:${PATTERNS.telefon})$`, "v").test(unos)).toBe(true);
    },
  );

  it("telefon sa slovima ne prolazi kroz pattern", () => {
    expect(new RegExp(`^(?:${PATTERNS.telefon})$`, "v").test("zovi me")).toBe(false);
  });
});
