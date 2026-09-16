import { describe, expect, it } from "vitest";

import {
  DANA_ZA_OZNAKU_NOV,
  PRAG_PRIKAZA_PREGLEDA,
  jeNovProfil,
  oznakaKartice,
  prikaziPreglede,
  vidljivostPregleda,
} from "./statistika";

/**
 * Prag za prikaz pregleda.
 *
 * Sitnica sa velikim efektom: „0 pregleda" na profilu novog majstora govori
 * posetiocu da niko nije bio ovde. Bolje ništa nego nula.
 */
describe("prikaz broja pregleda", () => {
  it.each([0, 1, 5, 19])("%d se ne prikazuje", (broj) => {
    expect(prikaziPreglede(broj)).toBe(false);
  });

  it.each([20, 21, 100, 5000])("%d se prikazuje", (broj) => {
    expect(prikaziPreglede(broj)).toBe(true);
  });

  it("prag je tačno granica, ne iznad nje", () => {
    expect(prikaziPreglede(PRAG_PRIKAZA_PREGLEDA)).toBe(true);
    expect(prikaziPreglede(PRAG_PRIKAZA_PREGLEDA - 1)).toBe(false);
  });
});

/**
 * Vlasnik je izuzet od praga.
 *
 * Bez ovoga majstor ne vidi nikakav dokaz da se pregledi broje dok ne skupi
 * dvadeset — pa prijavi da brojanje ne radi. Tačno to se i dogodilo.
 */
describe("vidljivost pregleda", () => {
  it.each([0, 1, 19])("vlasnik vidi i %d, ispod praga", (broj) => {
    expect(vidljivostPregleda({ broj, jeVlasnik: true })).toBe("samo-vlasnik");
  });

  it("vlasnik iznad praga i dalje vidi oznaku da brojku vidi samo on", () => {
    expect(vidljivostPregleda({ broj: 500, jeVlasnik: true })).toBe("samo-vlasnik");
  });

  it.each([0, 1, 19])("posetiocu se %d ne prikazuje", (broj) => {
    expect(vidljivostPregleda({ broj, jeVlasnik: false })).toBe("skriveno");
  });

  it.each([20, 21, 5000])("posetilac vidi %d kao javan podatak", (broj) => {
    expect(vidljivostPregleda({ broj, jeVlasnik: false })).toBe("javno");
  });

  it("prati prag umesto da ga ponavlja", () => {
    expect(vidljivostPregleda({ broj: PRAG_PRIKAZA_PREGLEDA, jeVlasnik: false })).toBe("javno");
    expect(vidljivostPregleda({ broj: PRAG_PRIKAZA_PREGLEDA - 1, jeVlasnik: false })).toBe(
      "skriveno",
    );
  });
});

/**
 * Oznaka „nov na sajtu".
 *
 * Postoji zbog rupe: kartica majstora ispod praga imala je praznu donju traku,
 * u istom redu sa karticom koja piše „213 pregleda". Prazno mesto nije neutralno
 * — čita se kao da nešto nedostaje.
 */
describe("kada je profil nov", () => {
  const sada = new Date("2026-09-16T12:00:00Z");
  const preDana = (n: number) => new Date(sada.getTime() - n * 24 * 60 * 60 * 1000);

  it("postavljen istog trenutka je nov", () => {
    expect(jeNovProfil(sada, sada)).toBe(true);
  });

  it.each([1, 7, DANA_ZA_OZNAKU_NOV - 1])("od pre %d dana je nov", (dana) => {
    expect(jeNovProfil(preDana(dana), sada)).toBe(true);
  });

  it("tačno na granici više nije nov", () => {
    expect(jeNovProfil(preDana(DANA_ZA_OZNAKU_NOV), sada)).toBe(false);
  });

  it.each([31, 90, 400])("od pre %d dana nije nov", (dana) => {
    expect(jeNovProfil(preDana(dana), sada)).toBe(false);
  });

  it("datum iz budućnosti se ne računa kao nov", () => {
    expect(jeNovProfil(new Date(sada.getTime() + 60_000), sada)).toBe(false);
  });
});

describe("oznaka u donjoj traci kartice", () => {
  it("pregledi imaju prednost nad oznakom „nov”", () => {
    expect(oznakaKartice({ profileViews: 250, jeNov: true })).toBe("pregledi");
  });

  it("star profil sa dovoljno pregleda prikazuje brojku", () => {
    expect(oznakaKartice({ profileViews: PRAG_PRIKAZA_PREGLEDA, jeNov: false })).toBe("pregledi");
  });

  it.each([0, 1, 19])("nov profil sa %d pregleda dobija oznaku umesto brojke", (broj) => {
    expect(oznakaKartice({ profileViews: broj, jeNov: true })).toBe("nov");
  });

  it("star profil ispod praga ne dobija ništa — traka se sklanja", () => {
    expect(oznakaKartice({ profileViews: 3, jeNov: false })).toBe("nista");
    expect(oznakaKartice({ profileViews: 0, jeNov: false })).toBe("nista");
  });
});
