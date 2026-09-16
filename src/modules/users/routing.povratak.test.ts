import { describe, expect, it } from "vitest";

import { bezbedanPovratak } from "./routing";

/**
 * Povratak posle prijave.
 *
 * Ovo je bezbednosni test, ne test udobnosti. `?next=` dolazi iz adrese, a
 * adresu može da sastavi bilo ko — i da je pošalje mejlom. Propuštena vrednost
 * koja vodi van sajta pretvara našu prijavu u odskočnu dasku za prevaru:
 * žrtva vidi naš domen u linku, prijavi se, i završi na tuđoj stranici koja
 * izgleda isto.
 */

describe("bezbedanPovratak — šta prolazi", () => {
  it.each([
    ["naslovna", "/"],
    ["listing", "/moleri/beograd"],
    ["profil", "/majstor/pera-moler-nis"],
    ["sa upitom", "/moleri?ocena=4"],
    ["sa sidrom", "/majstor/pera#recenzije"],
  ])("%s: %s", (_, next) => {
    expect(bezbedanPovratak(next)).toBe(next);
  });
});

describe("bezbedanPovratak — šta se odbija", () => {
  /*
   * `//zlo.rs` pretraživač čita kao „isti protokol, tuđi domen". Izgleda kao
   * putanja, nije putanja — najčešća greška u ovakvim proverama.
   */
  it.each([
    ["dve kose crte", "//zlo.rs"],
    ["dve kose crte sa putanjom", "//zlo.rs/prijava"],
    ["pun URL", "https://zlo.rs"],
    ["protokol bez šeme", "http://zlo.rs"],
    ["javascript", "javascript:alert(1)"],
    ["podaci", "data:text/html,<script>alert(1)</script>"],
    ["relativna putanja", "moleri/beograd"],
    ["obrnuta kosa crta", "/\\zlo.rs"],
    ["prazno", ""],
  ])("odbija %s", (_, next) => {
    expect(bezbedanPovratak(next)).toBeNull();
  });

  it.each([[null], [undefined]])("odbija %s", (next) => {
    expect(bezbedanPovratak(next)).toBeNull();
  });
});
