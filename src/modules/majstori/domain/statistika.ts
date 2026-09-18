/**
 * Kada se brojke javno prikazuju.
 *
 * Nov majstor sa „0 pregleda" izgleda kao da je sajt prazan — a to je prvi
 * utisak koji ostavlja na posetioca. Brojka koja ne govori ništa dobro bolje je
 * da ne stoji nego da stoji kao nula.
 *
 * Iznad praga počinje da znači nešto („ovog su gledali") i tada se pojavljuje
 * sama. Majstor svoje prave brojeve vidi na nalogu, bez praga.
 */
export const PRAG_PRIKAZA_PREGLEDA = 5;

export function prikaziPreglede(broj: number): boolean {
  return broj >= PRAG_PRIKAZA_PREGLEDA;
}

/** Ko vidi brojku pregleda na javnom profilu. */
export type VidljivostPregleda =
  /** Nikome se ne prikazuje — ispod praga, a gleda je posetilac. */
  | "skriveno"
  /** Stoji kao javni podatak, isto za svakoga ko otvori profil. */
  | "javno"
  /** Vlasnik profila — vidi pravu brojku, uz naznaku da je vidi samo on. */
  | "samo-vlasnik";

/**
 * Prag važi za posetioce, ne za vlasnika.
 *
 * Majstoru sa pet pregleda profil inače deluje mrtvo: pregledi se broje, ali
 * nigde se ne vide dok ne pređu prag, pa izgleda kao da brojanje ne radi.
 * Zato on svoju brojku vidi uvek — označenu, da je ne pomeša sa onim što
 * posetilac vidi.
 */
export function vidljivostPregleda(uslovi: {
  broj: number;
  jeVlasnik: boolean;
}): VidljivostPregleda {
  if (uslovi.jeVlasnik) return "samo-vlasnik";
  return prikaziPreglede(uslovi.broj) ? "javno" : "skriveno";
}

/**
 * Koliko dugo profil UOPŠTE može da važi za nov.
 *
 * Kapa, ne pravilo. Glavni uslov je odsustvo recenzija; ovo samo sprečava da
 * profil od pola godine sa nula recenzija i dalje stoji kao „nov" — takav nije
 * nov nego neaktivan, a zvati ga novim znači lagati posetioca.
 *
 * 60, a ne 30 dana: kod zanata prva recenzija stiže sporo, a podsetnik za
 * ocenjivanje još ne postoji. Broj je procena — proveriti podacima kad ih bude.
 */
export const DANA_ZA_OZNAKU_NOV = 60;

const DAN_U_MS = 24 * 60 * 60 * 1000;

/**
 * Da li profil nosi oznaku „Novo".
 *
 * ── Zašto NIJE samo tajmer ──
 *
 * Oznaka postoji da objasni odsustvo recenzija. Čim recenzija ima, one same
 * govore umesto nje — i tada oznaka postaje netačna, bez obzira na datum.
 * Obrnuto važi isto: majstor bez ijedne recenzije šestog dana i dalje jeste
 * nov, samo bi mu tajmer oduzeo objašnjenje zašto stoji na nuli.
 *
 * Tako to rade i veliki oglasnici i marketplace-ovi: oznaka nestaje kad se
 * pojavi trag, ne kad istekne rok.
 */
export function jeNovProfil(
  uslovi: { createdAt: Date; brojRecenzija: number },
  sada: Date = new Date(),
): boolean {
  /* Ima trag — recenzije govore umesto oznake. */
  if (uslovi.brojRecenzija > 0) return false;

  const proteklo = sada.getTime() - uslovi.createdAt.getTime();
  /*
   * Budući datum se ne računa kao „nov" po dogovoru — pomerena sistemska ura
   * ili loš unos ne sme da izmisli oznaku. Nula dana jeste nov.
   */
  if (proteklo < 0) return false;

  return proteklo < DANA_ZA_OZNAKU_NOV * DAN_U_MS;
}

/** Šta stoji u donjoj traci kartice. */
export type OznakaKartice =
  /** Broj pregleda — dovoljno ih je da nešto znače. */
  | "pregledi"
  /** Vlasnikova sopstvena brojka, ispod praga — vidi je samo on. */
  | "moji-pregledi"
  /** Nema šta da se kaže — traka se ne iscrtava. */
  | "nista";

/**
 * Donja traka kartice u pretrazi.
 *
 * Isto pravilo kao na profilu, kroz istu funkciju: posetiocu od praga naviše,
 * vlasniku uvek i označeno. Bez toga je ista brojka postojala na profilu a ne
 * na kartici — što izgleda kao greška čak i kad se zna zašto je tako.
 *
 * Poređenje vlasnika radi SERVER (`MajstorCard` je serverska komponenta), pa
 * `userId` nikad ne uđe u HTML koji stigne u pretraživač.
 *
 * Oznaka „Nov na sajtu" je nekad stajala ovde — preselila se na pilulu preko
 * fotografije, jer se u traci sa brojem pregleda čitala kao statistika, a ne
 * kao status.
 */
export function oznakaKartice(uslovi: {
  profileViews: number;
  jeVlasnik: boolean;
}): OznakaKartice {
  const vidljivost = vidljivostPregleda({ broj: uslovi.profileViews, jeVlasnik: uslovi.jeVlasnik });
  if (vidljivost === "skriveno") return "nista";
  return vidljivost === "samo-vlasnik" ? "moji-pregledi" : "pregledi";
}
