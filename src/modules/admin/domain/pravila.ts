/**
 * Pravila administracije.
 *
 * Sve ovde je čista logika, bez baze — jer su to odluke koje se ne smeju
 * proveravati „na oko" u komponenti, a jedine su koje mogu da se testiraju
 * bez pokrenutog Postgresa.
 */

export type UserRole = "USER" | "MAJSTOR" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

/* ─────────────────────────── Katalog ─────────────────────────── */

export type RazlogZabraneBrisanja = "ima-majstore" | "ima-usluge";

export type Brisanje = { sme: true } | { sme: false; razlog: RazlogZabraneBrisanja };

/**
 * Da li kategorija sme da se obriše.
 *
 * Brisanje kategorije koju neko koristi obara `/moleri` i `/moleri/beograd` —
 * adrese koje su u Google-u i koje su ceo smisao ovog sajta. Zato brisanje
 * postoji samo za kategoriju koju NIKO ne koristi, a sve ostalo se gasi.
 *
 * Gašenje (`isActive = false`) je bezbolno: profili ostaju, stranica ostaje,
 * kategorija samo nestaje iz izbora pri registraciji novih majstora.
 */
export function smeDaObriseKategoriju(stanje: {
  brojMajstora: number;
  brojUsluga: number;
}): Brisanje {
  if (stanje.brojMajstora > 0) return { sme: false, razlog: "ima-majstore" };
  if (stanje.brojUsluga > 0) return { sme: false, razlog: "ima-usluge" };
  return { sme: true };
}

/** Usluga se briše samo dok je nijedan majstor nije stavio u svoj cenovnik. */
export function smeDaObriseUslugu(stanje: { brojMajstora: number }): Brisanje {
  return stanje.brojMajstora > 0 ? { sme: false, razlog: "ima-majstore" } : { sme: true };
}

export const PORUKE_ZABRANE_BRISANJA: Record<RazlogZabraneBrisanja, string> = {
  "ima-majstore":
    "Postoje majstori u ovoj stavci. Ugasite je umesto da je brišete — profili i adresa ostaju.",
  "ima-usluge": "Prvo obrišite ili premestite usluge koje pripadaju ovoj kategoriji.",
};

/**
 * Slug se postavlja jednom i posle se ne dira.
 *
 * On JE adresa: `/moleri`, `/moleri/beograd`. Izmena znači da sve što je Google
 * indeksirao odjednom vraća 404, a svaki link sa strane prestaje da radi. Kad
 * se jednog dana bude menjao, ide zajedno sa trajnim preusmerenjem — ne sam.
 */
export function smeDaMenjaSlug(stanje: { postoji: boolean }): boolean {
  return !stanje.postoji;
}

/* ─────────────────────────── Korisnici ─────────────────────────── */

export type RazlogZabraneNadKorisnikom = "sam-sebi" | "poslednji-admin" | "nad-adminom";

export type Radnja = { sme: true } | { sme: false; razlog: RazlogZabraneNadKorisnikom };

/**
 * Da li akter sme da menja status ili ulogu drugog naloga.
 *
 * Tri zabrane, sve tri naučene na tuđim greškama:
 *
 * 1. Niko ne dira sam sebe — jedan pogrešan klik i admin je banovao sopstveni
 *    nalog, pa nema kome da se žali.
 * 2. Poslednji admin ne sme da ostane bez uloge; sistem bi ostao bez ijednog
 *    naloga koji može da uđe u administraciju.
 * 3. Admin ne banuje admina. Ako dvoje ljudi ima ključeve i posvađaju se,
 *    odluku donosi vlasnik u bazi, ne brži klik.
 */
export function smeNadKorisnikom(uslovi: {
  akterId: string;
  metaId: string;
  metaUloga: UserRole;
  brojAdmina: number;
}): Radnja {
  if (uslovi.akterId === uslovi.metaId) return { sme: false, razlog: "sam-sebi" };
  if (uslovi.metaUloga === "ADMIN") {
    return uslovi.brojAdmina <= 1
      ? { sme: false, razlog: "poslednji-admin" }
      : { sme: false, razlog: "nad-adminom" };
  }
  return { sme: true };
}

export const PORUKE_ZABRANE_NAD_KORISNIKOM: Record<RazlogZabraneNadKorisnikom, string> = {
  "sam-sebi": "Ne možete menjati sopstveni nalog odavde.",
  "poslednji-admin": "Ovo je poslednji administrator — sistem bi ostao bez pristupa.",
  "nad-adminom": "Administratorski nalog se menja u bazi, ne kroz ovaj ekran.",
};

/**
 * Šta ban znači za javni deo sajta.
 *
 * `BANNED` i `SUSPENDED` se razlikuju namerno: suspenzija je privremena mera
 * dok se nešto proverava, ban je kraj. Obе skidaju profil sa sajta, ali samo
 * ban skida i recenzije koje je taj nalog napisao — suspendovanom se veruje
 * dok se ne dokaže suprotno.
 */
export type PosledicaStatusa = {
  /** Profil majstora nestaje iz pretrage i sa svoje adrese. */
  skloniProfil: boolean;
  /** Recenzije koje je taj nalog napisao prestaju da se prikazuju. */
  skloniRecenzije: boolean;
  /** Sve sesije se brišu, pa korisnik ispada sa svih uređaja odmah. */
  prekiniSesije: boolean;
};

export function posledicaStatusa(status: UserStatus): PosledicaStatusa {
  switch (status) {
    case "ACTIVE":
      return { skloniProfil: false, skloniRecenzije: false, prekiniSesije: false };
    case "SUSPENDED":
      return { skloniProfil: true, skloniRecenzije: false, prekiniSesije: true };
    case "BANNED":
      return { skloniProfil: true, skloniRecenzije: true, prekiniSesije: true };
  }
}

/**
 * Da li se lozinka tog naloga uopšte može resetovati.
 *
 * Ko se prijavio Google-om nema lozinku kod nas — nema šta da se resetuje, a
 * dugme koje ne radi ništa gore je od dugmeta kog nema.
 */
export function imaLozinku(nacini: { provideri: string[] }): boolean {
  return nacini.provideri.includes("credential");
}
