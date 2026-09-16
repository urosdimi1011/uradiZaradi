import { describe, expect, it } from "vitest";

import { PORUKE, kategorijaSchema, uslugaSchema } from "./forme";

const KATEGORIJA = {
  slug: "moleri",
  nameLatn: "Moleri",
  nameCyrl: "Молери",
  nameSingularLatn: "Moler",
  nameSingularCyrl: "Молер",
  icon: "Paintbrush",
  introLatn: "x".repeat(80),
  introCyrl: "y".repeat(80),
  seoTitle: "",
  seoDescription: "",
  sortOrder: "1",
  isActive: "true",
};

const USLUGA = {
  slug: "krecenje",
  categoryId: "kat-1",
  nameLatn: "Krečenje",
  nameCyrl: "Кречење",
  defaultUnit: "M2" as const,
  allowedUnits: ["M2", "SAT"] as const,
  sortOrder: "0",
  isActive: "true",
};

describe("unos kategorije", () => {
  it("ispravan unos prolazi", () => {
    expect(kategorijaSchema.safeParse(KATEGORIJA).success).toBe(true);
  });

  it("prazan naziv pada", () => {
    const r = kategorijaSchema.safeParse({ ...KATEGORIJA, nameLatn: "   " });
    expect(r.success).toBe(false);
  });

  it.each(["moleri farbari", "moleri!", "moleri-", "-moleri", "molerić", "moleri--farbari"])(
    "slug „%s\" se odbija",
    (s) => {
      expect(kategorijaSchema.safeParse({ ...KATEGORIJA, slug: s }).success).toBe(false);
    },
  );

  it.each(["moleri", "gradjevinski-radovi", "klima-uredjaji", "a1"])(
    "slug „%s\" prolazi",
    (s) => {
      expect(kategorijaSchema.safeParse({ ...KATEGORIJA, slug: s }).success).toBe(true);
    },
  );

  it("velika slova u slugu se svode na mala, ne odbijaju", () => {
    const r = kategorijaSchema.safeParse({ ...KATEGORIJA, slug: "  MOLERI  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.slug).toBe("moleri");
  });

  it("kratak uvodni tekst pada — to je tanka stranica", () => {
    const r = kategorijaSchema.safeParse({ ...KATEGORIJA, introLatn: "Molerski radovi." });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe(PORUKE.intro);
  });

  it("prazan SEO naslov postaje nedefinisan, ne prazan string", () => {
    const r = kategorijaSchema.safeParse({ ...KATEGORIJA, seoTitle: "   " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.seoTitle).toBeUndefined();
  });

  it("redosled dolazi iz forme kao tekst i postaje broj", () => {
    const r = kategorijaSchema.safeParse({ ...KATEGORIJA, sortOrder: "7" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.sortOrder).toBe(7);
  });

  it("negativan redosled se odbija", () => {
    expect(kategorijaSchema.safeParse({ ...KATEGORIJA, sortOrder: "-1" }).success).toBe(false);
  });
});

describe("unos usluge", () => {
  it("ispravan unos prolazi", () => {
    expect(uslugaSchema.safeParse(USLUGA).success).toBe(true);
  });

  it("bez ijedne dozvoljene jedinice pada", () => {
    const r = uslugaSchema.safeParse({ ...USLUGA, allowedUnits: [] });
    expect(r.success).toBe(false);
  });

  /**
   * Najvažniji test u fajlu. Bez ovoga majstor dobija formular u kom je
   * unapred izabrana jedinica koju ne sme da izabere — i ne može da sačuva
   * cenu, a poruka mu ne kaže zašto.
   */
  it("podrazumevana jedinica van dozvoljenih se odbija", () => {
    const r = uslugaSchema.safeParse({ ...USLUGA, defaultUnit: "DAN", allowedUnits: ["M2"] });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toBe(PORUKE.podrazumevanaVanIzbora);
      expect(r.error.issues[0].path).toEqual(["defaultUnit"]);
    }
  });

  it("podrazumevana jedinica koja jeste među dozvoljenima prolazi", () => {
    expect(
      uslugaSchema.safeParse({ ...USLUGA, defaultUnit: "SAT", allowedUnits: ["M2", "SAT"] })
        .success,
    ).toBe(true);
  });

  it("nepostojeća merna jedinica se odbija", () => {
    expect(uslugaSchema.safeParse({ ...USLUGA, defaultUnit: "KVADRAT" }).success).toBe(false);
  });

  it("usluga bez kategorije se odbija", () => {
    expect(uslugaSchema.safeParse({ ...USLUGA, categoryId: "" }).success).toBe(false);
  });
});
