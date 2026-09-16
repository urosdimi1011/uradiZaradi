import { describe, expect, it } from "vitest";

import { DELOVI_GRADA, GRADOVI } from "./serbia";
import { toCyrillic, toSlug } from "@/lib/translit";

/**
 * Referentni podaci o gradovima.
 *
 * Ovo je najjeftiniji test u projektu i jedan od najkorisnijih: podaci se pišu
 * ručno, a greška u njima ne pukne nigde — samo napravi grad koji se ne može
 * otvoriti, dvostruki unos u padajućoj listi ili naslov stranice na lošem
 * srpskom koji Google odmah indeksira.
 *
 * Provera radi PRE nego što podaci uđu u bazu. Da je posle, greška bi već bila
 * u produkciji.
 */

describe("gradovi — identifikatori", () => {
  it("slug grada je jedinstven", () => {
    const slugovi = GRADOVI.map((g) => g.slug);
    expect(new Set(slugovi).size).toBe(slugovi.length);
  });

  /* Slug ide u URL (`/moleri/novi-sad`) — ništa osim malih slova, cifara i crtice. */
  it.each(GRADOVI.map((g) => [g.slug, g.latn] as const))("slug %s je bezbedan za URL", (slug) => {
    expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  /* Da neko ne upiše „Čačak" a slug ostavi „cacak2" ili obrnuto. */
  it.each(GRADOVI.map((g) => [g.latn, g.slug] as const))(
    "slug za %s odgovara imenu",
    (latn, slug) => {
      expect(slug).toBe(toSlug(latn));
    },
  );
});

describe("gradovi — sadržaj", () => {
  it.each(GRADOVI.map((g) => [g.slug, g] as const))("%s ima sva obavezna polja", (_, grad) => {
    expect(grad.latn.length).toBeGreaterThan(1);
    expect(grad.lokativ.length).toBeGreaterThan(1);
    expect(grad.okrug).toMatch(/okrug|Grad Beograd/);
    expect(grad.stanovnika).toBeGreaterThan(0);
  });

  /*
   * Lokativ ide u naslov stranice kao „Moleri u {lokativ}". Ako neko upiše
   * nominativ, naslov postane „Moleri u Šabac" — vidljivo pogrešno, i to na
   * stranici koju Google već indeksira.
   */
  it.each(GRADOVI.map((g) => [g.latn, g.lokativ] as const))(
    "lokativ za %s nije nominativ",
    (latn, lokativ) => {
      expect(lokativ).not.toBe(latn);
    },
  );

  it("lokativ ne sadrži predlog — predlog dodaje pozivalac", () => {
    for (const grad of GRADOVI) {
      expect(grad.lokativ.startsWith("u ")).toBe(false);
    }
  });

  /* Koordinate u granicama Srbije — hvata zamenjene lat/lng i omašene decimale. */
  it.each(GRADOVI.map((g) => [g.slug, g.lat, g.lng] as const))(
    "%s ima koordinate unutar Srbije",
    (_, lat, lng) => {
      expect(lat).toBeGreaterThan(42);
      expect(lat).toBeLessThan(46.5);
      expect(lng).toBeGreaterThan(18.5);
      expect(lng).toBeLessThan(23.5);
    },
  );

  it("Beograd je najveći — od njega zavisi redosled u navigaciji", () => {
    const najveci = [...GRADOVI].sort((a, b) => b.stanovnika - a.stanovnika)[0];
    expect(najveci?.slug).toBe("beograd");
  });
});

describe("delovi grada", () => {
  /*
   * Šema traži jedinstvenost slug-a SAMO u okviru grada (`@@unique([cityId, slug])`),
   * pa „palilula" sme da postoji i u Beogradu i u Nišu. Ali dvaput u istom gradu
   * ne sme — to bi oborilo seed.
   */
  it.each(GRADOVI.filter((g) => g.delovi.length > 0).map((g) => [g.slug, g] as const))(
    "%s nema dva dela sa istim slug-om",
    (_, grad) => {
      const slugovi = grad.delovi.map((deo) => deo.slug);
      expect(new Set(slugovi).size).toBe(slugovi.length);
    },
  );

  it("isti slug sme u različitim gradovima", () => {
    const palilule = DELOVI_GRADA.filter((deo) => deo.slug === "palilula");
    expect(palilule.length).toBe(2);
    expect(new Set(palilule.map((p) => p.gradSlug)).size).toBe(2);
  });

  it.each(DELOVI_GRADA.map((deo) => [`${deo.gradSlug}/${deo.slug}`, deo] as const))(
    "%s je bezbedan za URL i vezan za postojeći grad",
    (_, deo) => {
      expect(deo.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(GRADOVI.some((g) => g.slug === deo.gradSlug)).toBe(true);
    },
  );

  /* Beograd ima tačno 17 gradskih opština — broj je zvaničan i lako se omaši. */
  it("Beograd ima svih 17 gradskih opština", () => {
    expect(GRADOVI.find((g) => g.slug === "beograd")?.delovi).toHaveLength(17);
  });
});

describe("ćirilica se izvodi transliteracijom", () => {
  /*
   * Ćirilica se ne upisuje ručno nego se izvodi. Ovi gradovi imaju digrafe ili
   * naša slova — ako se `toCyrillic` pokvari, ovde se vidi pre nego u bazi.
   */
  it.each([
    ["Gornji Milanovac", "Горњи Милановац"],
    ["Inđija", "Инђија"],
    ["Čačak", "Чачак"],
    ["Šabac", "Шабац"],
    ["Novi Sad", "Нови Сад"],
    ["Sremska Mitrovica", "Сремска Митровица"],
  ])("%s → %s", (latn, cyrl) => {
    expect(toCyrillic(latn)).toBe(cyrl);
  });

  /* Svako ime mora da se prevede bez zaostale latinice. */
  it.each(GRADOVI.map((g) => [g.slug, g.latn] as const))(
    "%s nema zaostalih latiničnih slova posle prevoda",
    (_, latn) => {
      expect(toCyrillic(latn)).not.toMatch(/[A-Za-z]/);
    },
  );
});
