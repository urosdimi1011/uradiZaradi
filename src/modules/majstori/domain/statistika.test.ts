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
  it.each([0, 1, 4])("%d se ne prikazuje", (broj) => {
    expect(prikaziPreglede(broj)).toBe(false);
  });

  it.each([5, 6, 100, 5000])("%d se prikazuje", (broj) => {
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
 * Bez ovoga majstor ne vidi nikakav dokaz da se pregledi broje dok ne pređe
 * prag — pa prijavi da brojanje ne radi. Tačno to se i dogodilo.
 */
describe("vidljivost pregleda", () => {
  it.each([0, 1, 4])("vlasnik vidi i %d, ispod praga", (broj) => {
    expect(vidljivostPregleda({ broj, jeVlasnik: true })).toBe("samo-vlasnik");
  });

  it("vlasnik iznad praga i dalje vidi oznaku da brojku vidi samo on", () => {
    expect(vidljivostPregleda({ broj: 500, jeVlasnik: true })).toBe("samo-vlasnik");
  });

  it.each([0, 1, 4])("posetiocu se %d ne prikazuje", (broj) => {
    expect(vidljivostPregleda({ broj, jeVlasnik: false })).toBe("skriveno");
  });

  it.each([5, 6, 5000])("posetilac vidi %d kao javan podatak", (broj) => {
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
 * Oznaka „Novo".
 *
 * Nije tajmer nego odsustvo traga: postoji da objasni zašto profil stoji na
 * nula recenzija. Čim recenzija ima, one govore umesto nje.
 */
describe("kada profil nosi oznaku Novo", () => {
  const sada = new Date("2026-09-18T12:00:00Z");
  const preDana = (n: number) => new Date(sada.getTime() - n * 24 * 60 * 60 * 1000);
  const nov = (createdAt: Date, brojRecenzija = 0) =>
    jeNovProfil({ createdAt, brojRecenzija }, sada);

  it("postavljen istog trenutka, bez recenzija — nov", () => {
    expect(nov(sada)).toBe(true);
  });

  it.each([1, 7, 30, DANA_ZA_OZNAKU_NOV - 1])("od pre %d dana bez recenzija je nov", (dana) => {
    expect(nov(preDana(dana))).toBe(true);
  });

  /** Ovo je srž pravila: recenzija gasi oznaku bez obzira na datum. */
  it("jedna recenzija gasi oznaku i prvog dana", () => {
    expect(nov(sada, 1)).toBe(false);
  });

  it("recenzija gasi oznaku i kad je profil star jedan dan", () => {
    expect(nov(preDana(1), 3)).toBe(false);
  });

  it("tačno na kapi više nije nov, ni bez ijedne recenzije", () => {
    expect(nov(preDana(DANA_ZA_OZNAKU_NOV))).toBe(false);
  });

  it.each([61, 120, 400])("od pre %d dana nije nov — to je neaktivan, ne nov", (dana) => {
    expect(nov(preDana(dana))).toBe(false);
  });

  it("datum iz budućnosti se ne računa kao nov", () => {
    expect(nov(new Date(sada.getTime() + 60_000))).toBe(false);
  });

  it("kapa je 60 dana, ne 30 — prva recenzija kod zanata stiže sporo", () => {
    expect(DANA_ZA_OZNAKU_NOV).toBe(60);
    expect(nov(preDana(45))).toBe(true);
  });
});

describe("oznaka u donjoj traci kartice", () => {
  const posetilac = (profileViews: number) => oznakaKartice({ profileViews, jeVlasnik: false });
  const vlasnik = (profileViews: number) => oznakaKartice({ profileViews, jeVlasnik: true });

  it("posetilac vidi brojku od praga naviše", () => {
    expect(posetilac(PRAG_PRIKAZA_PREGLEDA)).toBe("pregledi");
    expect(posetilac(5000)).toBe("pregledi");
  });

  it.each([0, 1, 4])("posetiocu se %d ne prikazuje — traka se sklanja", (broj) => {
    expect(posetilac(broj)).toBe("nista");
  });

  /**
   * Zbog ovoga je pravilo i prošireno: ista brojka postojala je na profilu, a
   * na kartici ne — što izgleda kao greška čak i kad se zna zašto je tako.
   */
  it.each([0, 1, 3])("vlasnik vidi i %d, označeno kao samo njegovo", (broj) => {
    expect(vlasnik(broj)).toBe("moji-pregledi");
  });

  it("vlasniku se i iznad praga zadržava oznaka da brojku vidi samo on", () => {
    expect(vlasnik(500)).toBe("moji-pregledi");
  });

  it("prag je 5 — u početku pregleda nema mnogo", () => {
    expect(PRAG_PRIKAZA_PREGLEDA).toBe(5);
    expect(posetilac(4)).toBe("nista");
    expect(posetilac(5)).toBe("pregledi");
  });

  /**
   * „Nov na sajtu" je nekad stajao ovde kao zamena za preglede. Preselio se na
   * pilulu preko fotografije — ista stvar rečena na dva mesta na jednoj kartici
   * razvodnjava oba.
   */
  it("novost se više ne saopštava kroz traku", () => {
    expect(posetilac(0)).toBe("nista");
  });
});
