/**
 * Ugovor skladišta i pravila za slike.
 *
 * Bez `server-only` namerno: ograničenja (`OGRANICENJA`) trebaju i pretraživaču,
 * da formular odbije preveliku sliku pre nego što je pošalje kroz mrežu. Sam
 * ugovor ovde ne radi ništa — implementacije su u `vercel-blob.ts` i `local.ts`.
 */

export type SacuvanFajl = {
  /** Javna adresa za `<img src>`. */
  url: string;
  /** Putanja unutar skladišta — jedino po čemu se fajl kasnije briše. */
  kljuc: string;
  velicinaBajtova: number;
  tip: string;
};

export interface Skladiste {
  /** Vraća javnu adresu; `kljuc` određuje pozivalac, ne skladište. */
  sacuvaj(kljuc: string, podaci: Buffer, tip: string): Promise<SacuvanFajl>;
  obrisi(kljuc: string): Promise<void>;
}

export const OGRANICENJA = {
  /*
   * 5 MB po slici. Telefon lako napravi fotografiju od 8 MB, ali je pre slanja
   * sečemo i smanjujemo u pretraživaču, pa ono što stigne do servera treba da
   * bude znatno ispod ovoga. Granica postoji za slučaj da neko zaobiđe formu.
   */
  najviseBajtova: 5 * 1024 * 1024,

  /*
   * Samo formati koje svaki pretraživač ume da prikaže. HEIC sa iPhone-a nije
   * na spisku — Chrome na Windows-u ga ne prikazuje, pa bi slika postojala a
   * posetilac video prazan okvir. Sečenje u pretraživaču ga ionako pretvara
   * u JPEG pre slanja.
   */
  dozvoljeniTipovi: ["image/jpeg", "image/png", "image/webp"] as const,

  /** Ispod ovoga slika je toliko mala da na profilu izgleda mutno. */
  najmanjaStranica: 200,

  /** Najviše fotografija radova po majstoru. */
  najviseFotografija: 12,
} as const;

export type DozvoljenTip = (typeof OGRANICENJA.dozvoljeniTipovi)[number];

export type GreskaSlike =
  | { ok: false; razlog: "tip"; poruka: string }
  | { ok: false; razlog: "velicina"; poruka: string }
  | { ok: true };

/**
 * Provera koju rade OBE strane — pretraživač pre slanja i server pre upisa.
 *
 * Provera u pretraživaču je udobnost: korisnik odmah vidi da mu je slika
 * prevelika umesto da čeka upload pa dobije grešku. Provera na serveru je
 * zaštita: zahtev može da stigne i bez ijednog pretraživača.
 */
export function proveriSliku(tip: string, velicinaBajtova: number): GreskaSlike {
  if (!(OGRANICENJA.dozvoljeniTipovi as readonly string[]).includes(tip)) {
    return {
      ok: false,
      razlog: "tip",
      poruka: "Dozvoljene su samo JPG, PNG i WebP slike.",
    };
  }

  if (velicinaBajtova > OGRANICENJA.najviseBajtova) {
    const mb = (OGRANICENJA.najviseBajtova / (1024 * 1024)).toFixed(0);
    return {
      ok: false,
      razlog: "velicina",
      poruka: `Slika ne sme da bude veća od ${mb} MB.`,
    };
  }

  return { ok: true };
}

/**
 * Putanje u skladištu.
 *
 * `majstorId` je u putanji da bi se sve slike jednog majstora mogle naći i
 * obrisati kad se profil briše. Nasumičan sufiks sprečava da nova slika
 * završi na adresi stare, koju pretraživači i CDN-ovi već drže u kešu.
 */
export const KLJUC = {
  avatar: (majstorId: string, sufiks: string) => `majstori/${majstorId}/avatar-${sufiks}.jpg`,
  fotografija: (majstorId: string, sufiks: string) => `majstori/${majstorId}/rad-${sufiks}.jpg`,
} as const;
