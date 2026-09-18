import { describe, expect, it } from "vitest";

import { jeAktivnaPutanja } from "./aktivna-putanja";

describe("aktivna putanja", () => {
  it("ista adresa je aktivna", () => {
    expect(jeAktivnaPutanja("/sacuvano", "/sacuvano")).toBe(true);
  });

  it("druga adresa nije", () => {
    expect(jeAktivnaPutanja("/sacuvano", "/kategorije")).toBe(false);
  });

  /** Prva zamka: `/` je prefiks svake adrese na sajtu. */
  describe("početna", () => {
    it("aktivna je samo na korenu", () => {
      expect(jeAktivnaPutanja("/", "/")).toBe(true);
    });

    it.each(["/moleri", "/sacuvano", "/majstor/pera", "/nalog"])(
      "nije aktivna na %s",
      (putanja) => {
        expect(jeAktivnaPutanja(putanja, "/")).toBe(false);
      },
    );
  });

  /** Druga zamka: podstranica mora da označi roditelja. */
  describe("podstranice", () => {
    it("grad u putanji označava zanat", () => {
      expect(jeAktivnaPutanja("/moleri/beograd", "/moleri")).toBe(true);
    });

    it("recenzije označavaju profil majstora", () => {
      expect(jeAktivnaPutanja("/majstor/pera/recenzije", "/majstor/pera")).toBe(true);
    });

    it("roditelj ne označava dete", () => {
      expect(jeAktivnaPutanja("/moleri", "/moleri/beograd")).toBe(false);
    });
  });

  /** Treća zamka: granica mora biti kosa crta, ne bilo koji znak. */
  describe("granica segmenta", () => {
    it("/moleri ne označava /molerija", () => {
      expect(jeAktivnaPutanja("/molerija", "/moleri")).toBe(false);
    });

    it("/nalog ne označava /nalozi", () => {
      expect(jeAktivnaPutanja("/nalozi", "/nalog")).toBe(false);
    });
  });

  describe("normalizacija", () => {
    it("upit se zanemaruje", () => {
      expect(jeAktivnaPutanja("/moleri?grad=nis&sort=rating", "/moleri")).toBe(true);
    });

    it("fragment se zanemaruje", () => {
      expect(jeAktivnaPutanja("/kategorije#moleri", "/kategorije")).toBe(true);
    });

    it("završna kosa crta ne pravi razliku", () => {
      expect(jeAktivnaPutanja("/sacuvano/", "/sacuvano")).toBe(true);
      expect(jeAktivnaPutanja("/sacuvano", "/sacuvano/")).toBe(true);
    });

    it("prazna putanja se ponaša kao koren", () => {
      expect(jeAktivnaPutanja("", "/")).toBe(true);
      expect(jeAktivnaPutanja("", "/moleri")).toBe(false);
    });

    it("link sa upitom se poredi po putanji", () => {
      expect(jeAktivnaPutanja("/nalog", "/prijava?next=%2Fnalog")).toBe(false);
      expect(jeAktivnaPutanja("/prijava", "/prijava?next=%2Fnalog")).toBe(true);
    });
  });
});
