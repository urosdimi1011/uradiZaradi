import { describe, expect, it } from "vitest";

import { normalizujTelefon, prikaziTelefon, telefonZaPoziv } from "./telefon";

/**
 * Brojevi telefona.
 *
 * Najvažniji test u modulu za majstore. Broj je `@unique` i služi kao brava
 * protiv lažnih naloga — ako se isti broj svede na dva različita zapisa, brava
 * ne radi, a to se nigde ne vidi dok neko ne napravi deset profila.
 */

describe("normalizujTelefon — isti broj, jedan zapis", () => {
  /*
   * Ovo je srž: svih šest oblika je isti čovek i mora da da isti rezultat.
   * Da se razlikuju, jedinstvenost telefona u bazi bi bila prazno slovo.
   */
  it.each([
    "0641234567",
    "064 123 4567",
    "064/123-4567",
    "064 123 45 67",
    "+381641234567",
    "+381 64 123 4567",
    "00381641234567",
    "  064-123-4567  ",
    "(064) 123 4567",
    "641234567",
  ])("%s → +381641234567", (unos) => {
    expect(normalizujTelefon(unos)).toBe("+381641234567");
  });

  it("svi oblici daju međusobno isti rezultat", () => {
    const oblici = ["0611111111", "061 111 1111", "+381611111111", "00381611111111"];
    const rezultati = new Set(oblici.map(normalizujTelefon));
    expect(rezultati.size).toBe(1);
  });
});

describe("normalizujTelefon — šta prolazi", () => {
  it.each([
    ["mobilni sa 8 cifara", "064123456", "+38164123456"],
    ["mobilni sa 9 cifara", "0651234567", "+381651234567"],
    ["fiksni Beograd", "0111234567", "+381111234567"],
    ["fiksni Novi Sad", "021123456", "+38121123456"],
    ["fiksni Niš", "018123456", "+38118123456"],
  ])("%s: %s → %s", (_, unos, ocekivano) => {
    expect(normalizujTelefon(unos)).toBe(ocekivano);
  });
});

describe("normalizujTelefon — šta pada", () => {
  it.each([
    ["prazno", ""],
    ["samo razmaci", "   "],
    ["slova", "zovi me"],
    ["slova u broju", "064abc4567"],
    ["prekratko", "064123"],
    ["predugačko", "06412345678901"],
    ["strani broj", "+3859112345678"],
    ["nacionalni broj počinje nulom", "00123456789"],
    ["samo plus", "+"],
    ["nule", "0000000000"],
  ])("odbija %s", (_, unos) => {
    expect(normalizujTelefon(unos)).toBeNull();
  });

  /*
   * Ovo je bezbednosna provera, ne provera formata: broj ide u `tel:` link i u
   * SMS poziv, pa ubačeni znakovi ne smeju da prođu.
   */
  it.each(["064123456<script>", "064123456';DROP TABLE", "064123456\n064999999"])(
    "odbija ubačeni sadržaj: %s",
    (unos) => {
      expect(normalizujTelefon(unos)).toBeNull();
    },
  );
});

describe("prikaziTelefon", () => {
  it.each([
    ["+381641234567", "064 123 4567"],
    ["+38164123456", "064 123 456"],
    ["+381111234567", "011 123 4567"],
  ])("%s → %s", (kanonski, prikaz) => {
    expect(prikaziTelefon(kanonski)).toBe(prikaz);
  });

  /* Prikaz i svođenje moraju da budu obrnute operacije. */
  it.each(["+381641234567", "+38164123456", "+381111234567"])(
    "prikaz od %s se vraća u isti kanonski oblik",
    (kanonski) => {
      expect(normalizujTelefon(prikaziTelefon(kanonski))).toBe(kanonski);
    },
  );

  it("neispravan broj vraća nepromenjen umesto da puca", () => {
    expect(prikaziTelefon("besmislica")).toBe("besmislica");
  });
});

describe("telefonZaPoziv", () => {
  it("daje broj bez razmaka za tel: link", () => {
    expect(telefonZaPoziv("+381641234567")).toBe("+381641234567");
  });
});
