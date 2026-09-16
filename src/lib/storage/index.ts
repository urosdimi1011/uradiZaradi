import "server-only";

import type { Skladiste } from "./tip";

export type { Skladiste, SacuvanFajl } from "./tip";
export { KLJUC, OGRANICENJA, proveriSliku } from "./tip";

/**
 * Skladište fajlova — jedno mesto koje bira gde slike zaista odlaze.
 *
 * Aplikacija nikad ne zove `@vercel/blob` direktno. Zove `skladiste()`, a ovaj
 * fajl odlučuje koji drajver stoji iza toga. Prelazak na Cloudflare R2 ili na
 * lokalni disk je onda izmena OVDE, a ne u svakoj komponenti koja prima sliku.
 *
 * Bira se preko `STORAGE_DRIVER` u `.env`:
 *
 *   vercel-blob   podrazumevano; traži `BLOB_READ_WRITE_TOKEN`
 *   local         piše u `public/uploads`; za razvoj bez ijednog naloga
 *
 * Napomena o `local`: radi samo tamo gde je fajl sistem upisiv. Na Vercelu nije
 * — tamo se svaka izmena diska gubi pri sledećem pozivu. Zato je `local` dobar
 * za rad na mašini, a ne za produkciju.
 *
 * Drajver se učitava lenjo (`await import`), pa `@vercel/blob` ne ulazi u paket
 * kad se koristi lokalni disk, i obrnuto.
 */

type Drajver = "vercel-blob" | "local";

function izabraniDrajver(): Drajver {
  const iz = process.env.STORAGE_DRIVER;
  if (iz === "local" || iz === "vercel-blob") return iz;

  /*
   * Bez izričitog izbora: lokalni disk u razvoju, Blob u produkciji. Tako
   * niko ne mora da pravi Vercel nalog da bi pokrenuo projekat na svojoj
   * mašini, a produkcija ne može slučajno da završi na disku koji nestaje.
   */
  return process.env.NODE_ENV === "production" ? "vercel-blob" : "local";
}

let kesirano: Promise<Skladiste> | null = null;

export function skladiste(): Promise<Skladiste> {
  kesirano ??= ucitaj();
  return kesirano;
}

async function ucitaj(): Promise<Skladiste> {
  const drajver = izabraniDrajver();

  if (drajver === "vercel-blob") {
    const { vercelBlobSkladiste } = await import("./vercel-blob");
    return vercelBlobSkladiste();
  }

  const { lokalnoSkladiste } = await import("./local");
  return lokalnoSkladiste();
}
