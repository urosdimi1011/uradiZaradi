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
export const PRAG_PRIKAZA_PREGLEDA = 20;

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

/** Koliko dugo profil važi za nov. */
export const DANA_ZA_OZNAKU_NOV = 30;

const DAN_U_MS = 24 * 60 * 60 * 1000;

export function jeNovProfil(createdAt: Date, sada: Date = new Date()): boolean {
  const proteklo = sada.getTime() - createdAt.getTime();
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
  /** Tek postavljen profil; brojke još nema, ali je svežina sama po sebi podatak. */
  | "nov"
  /** Nema šta da se kaže — traka se ne iscrtava. */
  | "nista";

/**
 * Donja traka kartice u pretrazi.
 *
 * Pregledi imaju prednost: konkretan broj govori više od oznake. Ispod praga
 * kartica novog majstora ostajala je sa praznom trakom — obris bez sadržaja,
 * odmah do kartice sa „213 pregleda". „Nov na sajtu" popunjava to mesto nečim
 * istinitim i, za posetioca koji traži nekog slobodnog, korisnim.
 *
 * Star profil sa malo pregleda ne dobija ništa. Ni oznaku „nov" (bila bi laž),
 * ni brojku (radila bi protiv njega) — traka se tada sklanja.
 */
export function oznakaKartice(uslovi: { profileViews: number; jeNov: boolean }): OznakaKartice {
  if (prikaziPreglede(uslovi.profileViews)) return "pregledi";
  return uslovi.jeNov ? "nov" : "nista";
}
