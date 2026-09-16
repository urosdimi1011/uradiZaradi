import { describe, expect, it } from "vitest";

import { dozvoljeneJedinice, SVE_USLUGE, USLUGE } from "./usluge";
import { toSlug } from "@/lib/translit";

/**
 * Referentne usluge.
 *
 * Greška ovde ne pukne nigde — samo napravi uslugu koju majstor ne može da
 * ponudi, ili jedinicu koja u listingu daje cenu bez smisla („Beljenje zidova
 * od 3.000 RSD / komad").
 */

describe("usluge — identifikatori", () => {
  /*
   * `ServiceType.slug` je `@unique` na nivou CELE baze, ne po kategoriji. Dve
   * kategorije sa istim slug-om oborile bi seed — a lako je promašiti, jer i
   * moler i građevinac rade „gipsane radove".
   */
  it("slug usluge je jedinstven u celoj bazi", () => {
    const slugovi = SVE_USLUGE.map((usluga) => usluga.slug);
    const duplikati = slugovi.filter((slug, i) => slugovi.indexOf(slug) !== i);
    expect(duplikati).toEqual([]);
  });

  it.each(SVE_USLUGE.map((usluga) => [usluga.slug] as const))("slug %s je bezbedan za URL", (slug) => {
    expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  /*
   * Slug NE mora doslovno da odgovara imenu — „Priključenje veš ili sudo mašine"
   * kao slug bio bi neupotrebljiv. Ali mora da bude izveden iz nečega u imenu,
   * da se ne izgubi veza kad se slug prekopira iz pogrešnog reda.
   *
   * Poredi se po PREFIKSU, ne po celoj reči: srpski menja nastavke, pa slug
   * „razvodna-tabla" stoji uz ime „Ugradnja razvodne table". Poređenje celih
   * reči bi ovde tražilo da slug bude u genitivu, što u URL-u nema smisla.
   */
  it.each(SVE_USLUGE.map((usluga) => [usluga.slug, usluga.latn] as const))(
    "slug %s je izveden iz imena",
    (slug, latn) => {
      const koren = (rec: string) => rec.slice(0, 4);
      const korenIzImena = new Set(toSlug(latn).split("-").map(koren));
      const povezano = slug.split("-").some((rec) => korenIzImena.has(koren(rec)));
      expect(povezano).toBe(true);
    },
  );
});

describe("usluge — merne jedinice", () => {
  it.each(SVE_USLUGE.map((usluga) => [usluga.slug, usluga] as const))(
    "%s: podrazumevana jedinica je među dozvoljenima",
    (_, usluga) => {
      expect(dozvoljeneJedinice(usluga)).toContain(usluga.jedinica);
    },
  );

  /* Uvek postoji posao koji se ne da izmeriti unapred. */
  it.each(SVE_USLUGE.map((usluga) => [usluga.slug, usluga] as const))(
    "%s nudi i „po dogovoru\"",
    (_, usluga) => {
      expect(dozvoljeneJedinice(usluga)).toContain("PO_DOGOVORU");
    },
  );

  it.each(SVE_USLUGE.map((usluga) => [usluga.slug, usluga] as const))(
    "%s nema ponovljenu jedinicu u spisku",
    (_, usluga) => {
      const jedinice = dozvoljeneJedinice(usluga);
      expect(new Set(jedinice).size).toBe(jedinice.length);
    },
  );

  /*
   * Zdravorazumska provera: usluga koja se meri po kvadratu ne sme da bude
   * jedino „po komadu" i obrnuto. Ovo hvata prekucavanje pri dodavanju.
   */
  it("beljenje i gletovanje idu po kvadratu", () => {
    for (const slug of ["belenje-zidova", "gletovanje", "postavljanje-plocica"]) {
      expect(SVE_USLUGE.find((usluga) => usluga.slug === slug)?.jedinica).toBe("M2");
    }
  });

  it("hitne intervencije i ugradnje idu po komadu ili satu", () => {
    for (const slug of ["hitno-otvaranje", "zamena-brave", "ugradnja-klime"]) {
      expect(SVE_USLUGE.find((usluga) => usluga.slug === slug)?.jedinica).toBe("KOMAD");
    }
  });
});

describe("usluge — pokrivenost kategorija", () => {
  const KATEGORIJE = [
    "moleri",
    "elektricari",
    "vodoinstalateri",
    "keramicari",
    "stolari",
    "klima-uredjaji",
    "gradjevinski-radovi",
    "bravari",
    "parketari",
  ];

  it("svaka kategorija iz baze ima svoje usluge", () => {
    expect(Object.keys(USLUGE).sort()).toEqual([...KATEGORIJE].sort());
  });

  /*
   * Ispod sedam usluga korak „Usluge i cene" izgleda prazno, a majstor nema šta
   * da ponudi pa odustane. Sedam je donja granica koju smo postavili.
   */
  it.each(Object.entries(USLUGE))("%s ima bar 7 usluga", (_, usluge) => {
    expect(usluge.length).toBeGreaterThanOrEqual(7);
  });

  it("nijedna kategorija nema istu uslugu dvaput", () => {
    for (const [kategorija, usluge] of Object.entries(USLUGE)) {
      const slugovi = usluge.map((usluga) => usluga.slug);
      expect(new Set(slugovi).size, kategorija).toBe(slugovi.length);
    }
  });
});
