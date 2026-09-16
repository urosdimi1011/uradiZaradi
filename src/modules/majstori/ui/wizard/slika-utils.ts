"use client";

import { OGRANICENJA } from "@/lib/storage/tip";

/**
 * Obrada slike u PRETRAŽIVAČU.
 *
 * Sve — sečenje, smanjivanje, pretvaranje u JPEG — radi se ovde, pre slanja.
 * Razlozi su dva:
 *
 *   1. Server ne mora da ima `sharp`, procesor ni vreme za obradu svake slike.
 *   2. Telefon pravi fotografiju od 8 MB; posle obrade se šalje oko 200 KB.
 *      Majstoru na mobilnom internetu to je razlika između tri sekunde i pola
 *      minuta.
 *
 * HEIC sa iPhone-a usput nestaje: `canvas` ga izbaci kao JPEG, pa slika koju
 * Chrome na Windows-u ne bi prikazao više ne postoji.
 */

export type Isecak = { x: number; y: number; width: number; height: number };

/** Strana isečenog avatara. Preko ovoga slika samo troši prostor. */
const AVATAR_STRANA = 800;

/** Duža strana fotografije rada. */
const FOTOGRAFIJA_DUZA_STRANA = 1600;

/**
 * Kvalitet JPEG-a.
 *
 * 0.85 je uobičajena granica iznad koje razlika prestaje da se vidi a fajl
 * nastavlja da raste.
 */
const KVALITET = 0.85;

function ucitajSliku(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const slika = new Image();
    slika.onload = () => resolve(slika);
    slika.onerror = () => reject(new Error("Slika ne može da se učita."));
    slika.src = src;
  });
}

async function uBlob(platno: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) =>
    platno.toBlob(resolve, "image/jpeg", KVALITET),
  );
  if (!blob) throw new Error("Slika ne može da se obradi.");
  return blob;
}

/**
 * Seče izabrani deo i smanjuje ga na kvadrat.
 *
 * `isecak` dolazi iz `react-easy-crop` u pikselima originalne slike, pa se
 * `drawImage` poziva sa te površine — bez preračunavanja iz procenata.
 */
export async function isecinAvatar(src: string, isecak: Isecak): Promise<Blob> {
  const slika = await ucitajSliku(src);

  const strana = Math.min(AVATAR_STRANA, Math.round(isecak.width));
  const platno = document.createElement("canvas");
  platno.width = strana;
  platno.height = strana;

  const kontekst = platno.getContext("2d");
  if (!kontekst) throw new Error("Slika ne može da se obradi.");

  /* Glatko smanjivanje; bez ovoga se na ivicama vide stepenice. */
  kontekst.imageSmoothingQuality = "high";
  kontekst.drawImage(
    slika,
    isecak.x,
    isecak.y,
    isecak.width,
    isecak.height,
    0,
    0,
    strana,
    strana,
  );

  return uBlob(platno);
}

/** Smanjuje fotografiju rada bez sečenja — odnos stranica ostaje kakav je. */
export async function smanjiFotografiju(src: string): Promise<Blob> {
  const slika = await ucitajSliku(src);

  const razmera = Math.min(1, FOTOGRAFIJA_DUZA_STRANA / Math.max(slika.width, slika.height));
  const platno = document.createElement("canvas");
  platno.width = Math.round(slika.width * razmera);
  platno.height = Math.round(slika.height * razmera);

  const kontekst = platno.getContext("2d");
  if (!kontekst) throw new Error("Slika ne može da se obradi.");

  kontekst.imageSmoothingQuality = "high";
  kontekst.drawImage(slika, 0, 0, platno.width, platno.height);

  return uBlob(platno);
}

/**
 * Provera pre nego što se slika uopšte učita.
 *
 * Ista pravila važe i na serveru; ovde su zbog brzine odgovora, ne zbog
 * zaštite — zahtev može da stigne i mimo ove forme.
 */
export function proveriIzabranFajl(fajl: File): string | null {
  if (!(OGRANICENJA.dozvoljeniTipovi as readonly string[]).includes(fajl.type)) {
    /*
     * iPhone šalje HEIC. Poruka ga imenuje, jer „format nije podržan" čoveku
     * koji je slikao telefonom ne znači ništa.
     */
    return fajl.type === "image/heic" || fajl.name.toLowerCase().endsWith(".heic")
      ? "iPhone HEIC format nije podržan. U podešavanjima kamere izaberite „Najkompatibilnije” pa pokušajte ponovo."
      : "Dozvoljene su samo JPG, PNG i WebP slike.";
  }

  /* Granica je velikodušna jer se slika svejedno smanjuje pre slanja. */
  if (fajl.size > OGRANICENJA.najviseBajtova * 4) {
    return "Slika je prevelika. Izaberite manju fotografiju.";
  }

  return null;
}
