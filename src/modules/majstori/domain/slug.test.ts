import { describe, expect, it } from "vitest";

import { jedinstvenSlug, osnovaSluga } from "./slug";

describe("osnovaSluga", () => {
  it.each([
    [["Petar Petrović", "Moler", "Beograd"], "petar-petrovic-moler-beograd"],
    /* Đ i đ idu u „dj", ne u „d" — tako se srpska imena pišu bez dijakritike. */
    [["Đorđe Šćepanović", "Keramičar", "Novi Sad"], "djordje-scepanovic-keramicar-novi-sad"],
    [["Ana Marić-Jovanović", "Stolar", "Čačak"], "ana-maric-jovanovic-stolar-cacak"],
    [["Petrović & sinovi", "Bravar", "Niš"], "petrovic-sinovi-bravar-nis"],
  ])("%s → %s", (ulaz, ocekivano) => {
    const [ime, zanat, grad] = ulaz as [string, string, string];
    expect(osnovaSluga(ime, zanat, grad)).toBe(ocekivano);
  });

  /* Slug ide u URL — ništa osim malih slova, cifara i crtice. */
  it.each([
    ["HTML u imenu", "<script>alert(1)</script>", "Moler", "Beograd"],
    ["navodnici", 'Pera "Majstor" Perić', "Moler", "Niš"],
    ["višestruki razmaci", "Pera    Perić", "Moler", "Niš"],
    ["ćirilica", "Петар Петровић", "Moler", "Beograd"],
  ])("%s daje bezbedan slug", (_, ime, zanat, grad) => {
    expect(osnovaSluga(ime, zanat, grad)).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  /* Naziv radnje od dvesta znakova dao bi adresu koju niko ne može da podeli. */
  it("skraćuje predugačko ime", () => {
    const slug = osnovaSluga("A".repeat(200), "Moler", "Beograd");
    expect(slug.length).toBeLessThan(70);
    expect(slug.endsWith("moler-beograd")).toBe(true);
  });

  it("ne ostavlja crticu na početku ni na kraju", () => {
    expect(osnovaSluga("!!!", "Moler", "Beograd")).toBe("moler-beograd");
  });

  /* Ako od svega ostane prazno, mora nešto da stoji — prazan slug bi oborio upis. */
  it("nikad ne vraća prazno", () => {
    expect(osnovaSluga("!!!", "###", "***")).toBe("majstor");
  });
});

describe("jedinstvenSlug", () => {
  it("slobodan slug ostaje nepromenjen", async () => {
    const slug = await jedinstvenSlug("pera-moler-nis", async () => false);
    expect(slug).toBe("pera-moler-nis");
  });

  /* Dva Petra Petrovića, oba molera u Beogradu, nisu retkost. */
  it("zauzet slug dobija sufiks -2", async () => {
    const zauzeti = new Set(["pera-moler-nis"]);
    const slug = await jedinstvenSlug("pera-moler-nis", async (s) => zauzeti.has(s));
    expect(slug).toBe("pera-moler-nis-2");
  });

  it("broji dalje kad je i -2 zauzet", async () => {
    const zauzeti = new Set(["pera-moler-nis", "pera-moler-nis-2", "pera-moler-nis-3"]);
    const slug = await jedinstvenSlug("pera-moler-nis", async (s) => zauzeti.has(s));
    expect(slug).toBe("pera-moler-nis-4");
  });

  /*
   * Osigurač: da provera iz bilo kog razloga uvek vrati „zauzeto", petlja ne
   * sme da traje doveka — upis bi visio i korisnik bi gledao spinner bez kraja.
   */
  it("posle granice pokušaja pribegava nasumičnom sufiksu", async () => {
    const slug = await jedinstvenSlug("pera-moler-nis", async () => true, 5);
    expect(slug).toMatch(/^pera-moler-nis-[a-z0-9]{6}$/);
  });

  it("rezultat je uvek bezbedan za URL", async () => {
    const zauzeti = new Set(["pera-moler-nis"]);
    const slug = await jedinstvenSlug("pera-moler-nis", async (s) => zauzeti.has(s));
    expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });
});
