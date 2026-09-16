import "server-only";

import { del, put } from "@vercel/blob";

import type { SacuvanFajl, Skladiste } from "./tip";

/**
 * Vercel Blob.
 *
 * Traži `BLOB_READ_WRITE_TOKEN` u okruženju. Greška se javlja pri prvoj
 * upotrebi, a ne pri pokretanju aplikacije — ko ne dira slike, ne mora da ima
 * token.
 */
export function vercelBlobSkladiste(): Skladiste {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  return {
    async sacuvaj(kljuc, podaci, tip): Promise<SacuvanFajl> {
      if (!token) {
        throw new Error(
          "BLOB_READ_WRITE_TOKEN nije postavljen. Dodaj ga u .env ili prebaci STORAGE_DRIVER=local.",
        );
      }

      const rezultat = await put(kljuc, podaci, {
        access: "public",
        contentType: tip,
        token,
        /*
         * Bez nasumičnog sufiksa iz Vercela — ključ već nosi svoj, pa je
         * predvidljiv i moguće ga je obrisati po imenu. Sa njihovim sufiksom
         * bismo morali da pamtimo punu adresu da bismo je kasnije uklonili.
         */
        addRandomSuffix: false,
        /* Ista adresa posle ponovnog upisa (npr. zamena avatara). */
        allowOverwrite: true,
      });

      return {
        url: rezultat.url,
        kljuc,
        velicinaBajtova: podaci.byteLength,
        tip,
      };
    },

    async obrisi(kljuc) {
      if (!token) return;
      /*
       * Brisanje nepostojećeg fajla nije greška za nas: poziva se i pri
       * čišćenju posle neuspelog upisa, kad se ne zna da li je fajl stigao.
       */
      await del(kljuc, { token }).catch(() => undefined);
    },
  };
}
