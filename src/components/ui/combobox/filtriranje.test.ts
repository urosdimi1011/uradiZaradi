import { describe, expect, it } from "vitest";

import { filtrirajOpcije, type Opcija } from "./filtriranje";

/**
 * Pretraga u padajućoj listi MORA da se ponaša isto kao pretraga na sajtu.
 * Obe idu kroz `normalizeForSearch`; ovi testovi to zaključavaju, jer bi
 * razilaženje značilo da „cacak" nalazi majstora ali ne nalazi grad.
 */
const GRADOVI: Opcija[] = [
  { vrednost: "", tekst: "Cela Srbija" },
  { vrednost: "beograd", tekst: "Beograd" },
  { vrednost: "novi-sad", tekst: "Novi Sad" },
  { vrednost: "nis", tekst: "Niš" },
  { vrednost: "cacak", tekst: "Čačak" },
  { vrednost: "kragujevac", tekst: "Kragujevac" },
  { vrednost: "sremska-mitrovica", tekst: "Sremska Mitrovica" },
];

const nazivi = (o: Opcija[]) => o.map((x) => x.tekst);

describe("filtriranje opcija", () => {
  it("prazan upit vraća sve", () => {
    expect(filtrirajOpcije(GRADOVI, "")).toHaveLength(GRADOVI.length);
  });

  it("sam razmak nije upit", () => {
    expect(filtrirajOpcije(GRADOVI, "   ")).toHaveLength(GRADOVI.length);
  });

  it("nalazi bez dijakritike", () => {
    expect(nazivi(filtrirajOpcije(GRADOVI, "nis"))).toEqual(["Niš"]);
    expect(nazivi(filtrirajOpcije(GRADOVI, "cacak"))).toEqual(["Čačak"]);
  });

  it("nalazi kad je upit sa dijakritikom, a spisak bez nje", () => {
    expect(nazivi(filtrirajOpcije(GRADOVI, "Čač"))).toEqual(["Čačak"]);
  });

  it("ćirilični upit nalazi latinični naziv", () => {
    expect(nazivi(filtrirajOpcije(GRADOVI, "ниш"))).toEqual(["Niš"]);
    expect(nazivi(filtrirajOpcije(GRADOVI, "Београд"))).toEqual(["Beograd"]);
  });

  it("traži bilo gde u nazivu, ne samo na početku", () => {
    expect(nazivi(filtrirajOpcije(GRADOVI, "sad"))).toEqual(["Novi Sad"]);
    expect(nazivi(filtrirajOpcije(GRADOVI, "mitrovica"))).toEqual(["Sremska Mitrovica"]);
  });

  it("ne razlikuje velika i mala slova", () => {
    expect(nazivi(filtrirajOpcije(GRADOVI, "BEOGRAD"))).toEqual(["Beograd"]);
  });

  it("višestruki razmaci u upitu se svode na jedan", () => {
    expect(nazivi(filtrirajOpcije(GRADOVI, "novi   sad"))).toEqual(["Novi Sad"]);
  });

  it("vraća sve pogotke, ne samo prvi", () => {
    expect(nazivi(filtrirajOpcije(GRADOVI, "a"))).toContain("Beograd");
    expect(filtrirajOpcije(GRADOVI, "a").length).toBeGreaterThan(1);
  });

  it("bez pogotka vraća praznu listu", () => {
    expect(filtrirajOpcije(GRADOVI, "xyzw")).toEqual([]);
  });

  it("ne menja prosleđenu listu", () => {
    const kopija = [...GRADOVI];
    filtrirajOpcije(GRADOVI, "nis");
    expect(GRADOVI).toEqual(kopija);
  });
});
