import type { MajstorStatus } from "@/generated/prisma/client";
import type { CurrentUser } from "@/lib/session";

/**
 * Odluke o tome gde korisnik ide i šta mu piše u traci.
 *
 * Ovaj modul je NAMERNO bez ijednog uvoza koji nešto radi — samo tipovi, koji
 * se brišu pri prevođenju. Bez baze, bez sesije, bez `server-only`.
 *
 * Razlog je praktičan: dok su ove funkcije stajale pored poziva repozitorijuma,
 * test im nije mogao prići a da ne povuče Prismu i traži `DATABASE_URL`. Odluka
 * o tome na koju stranicu ide majstor nema nikakve veze sa bazom i ne treba joj
 * baza da bi se proverila.
 *
 * Dohvatanje podatka je u `navigation.ts`, koji ove funkcije koristi.
 */

export type StanjeProfila =
  /** Uloga je MAJSTOR, ali profil nije ni započet. */
  | { vrsta: "nije-zapocet" }
  | { vrsta: "u-izradi" }
  | { vrsta: "u-pregledu" }
  | { vrsta: "objavljen"; slug: string }
  | { vrsta: "skinut" };

/** Status iz baze → stanje koje razume ostatak aplikacije. */
export function stanjeOdStatusa(
  profil: { status: MajstorStatus; slug: string } | null,
): StanjeProfila {
  if (!profil) return { vrsta: "nije-zapocet" };

  switch (profil.status) {
    case "DRAFT":
      return { vrsta: "u-izradi" };
    case "PENDING_REVIEW":
      return { vrsta: "u-pregledu" };
    case "ACTIVE":
      return { vrsta: "objavljen", slug: profil.slug };
    /* SUSPENDED i BANNED: profil postoji ali nije javan — majstor to mora da zna. */
    default:
      return { vrsta: "skinut" };
  }
}

/**
 * Putanja na koju korisnik ide odmah posle prijave.
 *
 * Jedno mesto umesto provere u middleware-u: middleware bi na SVAKI zahtev
 * otvarao bazu da proveri profil, a odluka je potrebna tačno jednom — u
 * trenutku prijave.
 *
 * Majstor sa nedovršenim profilom se vraća tamo gde je stao. To je podsticaj,
 * a ne kavez — popunjavanje profila ima vidljivo „Nastavi kasnije", i odatle
 * sme bilo gde. Profil koji nema javnu stranicu (na čekanju ili skinut) ide na
 * nalog, jer bi ga `/majstor/...` dočekalo sa 404 odmah posle prijave.
 */
/**
 * Da li je `next` iz adrese bezbedan za preusmeravanje.
 *
 * Mora da bude putanja UNUTAR sajta. `//zlo.rs` i `https://zlo.rs` pretraživač
 * tumači kao tuđi domen — propuštena, takva vrednost bi od naše prijave
 * napravila odskočnu dasku za prevaru („otvorio sam vaš sajt i završio na
 * tuđem").
 */
export function bezbedanPovratak(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//")) return null;
  /* Obrnuta kosa crta neki pretraživači tumače kao kosu — ista zamka. */
  if (next.includes("\\")) return null;
  return next;
}

export function putanjaZaStanje(role: CurrentUser["role"], stanje: StanjeProfila | null): string {
  if (role === "ADMIN") return "/admin";
  if (!stanje) return "/";

  switch (stanje.vrsta) {
    case "nije-zapocet":
    case "u-izradi":
      return "/registracija-majstora";
    case "objavljen":
      return `/majstor/${stanje.slug}`;
    default:
      return "/nalog";
  }
}
