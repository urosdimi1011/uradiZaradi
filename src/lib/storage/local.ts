import "server-only";

import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, normalize, sep } from "node:path";

import type { SacuvanFajl, Skladiste } from "./tip";

/**
 * Lokalni disk — `public/uploads`.
 *
 * Postoji da bi projekat radio na svakoj mašini bez ijednog naloga kod Vercela
 * ili Cloudflare-a. Next statički servira sve iz `public`, pa je `/uploads/…`
 * odmah dostupna adresa.
 *
 * NE koristiti u produkciji na platformama bez trajnog diska: tamo fajl
 * preživi do sledećeg pokretanja, a slike majstora tiho nestanu.
 */
const KOREN = join(process.cwd(), "public", "uploads");

/**
 * Ključ dolazi iz koda, ne od korisnika — ali se svejedno proverava.
 *
 * Da neko ikad prosledi `../../.env` kao ključ, upis bi izašao iz `public` i
 * pregazio fajl u projektu. Provera je jeftina, a propust ove vrste je
 * nepovratan.
 */
function bezbednaPutanja(kljuc: string): string {
  const puna = normalize(join(KOREN, kljuc));
  if (!puna.startsWith(KOREN + sep)) {
    throw new Error(`Nedozvoljena putanja u skladištu: ${kljuc}`);
  }
  return puna;
}

export function lokalnoSkladiste(): Skladiste {
  return {
    async sacuvaj(kljuc, podaci, tip): Promise<SacuvanFajl> {
      const putanja = bezbednaPutanja(kljuc);
      await mkdir(dirname(putanja), { recursive: true });
      await writeFile(putanja, podaci);

      return {
        /* Uvek kose crte — Windows daje `\`, a u URL-u to nije putanja. */
        url: `/uploads/${kljuc.split(sep).join("/")}`,
        kljuc,
        velicinaBajtova: podaci.byteLength,
        tip,
      };
    },

    async obrisi(kljuc) {
      await rm(bezbednaPutanja(kljuc), { force: true });
    },
  };
}
