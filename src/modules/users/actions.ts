"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/session";
import { signInSchema, signUpSchema } from "./domain/auth";
import { putanjaPoslePrijave } from "./navigation";
import { bezbedanPovratak } from "./routing";

/**
 * Prijava i registracija kroz Server Actions.
 *
 * Isti obrazac kao ostatak projekta — forme rade i bez JavaScripta. Klijentska
 * biblioteka bi tražila `fetch` iz pretraživača i formu koja bez JS-a ne radi
 * ništa; ovako je progresivno poboljšanje zadržano.
 */

/** Polja koja forme prikazuju — ključevi grešaka i vrednosti za popunjavanje. */
type Polje = "name" | "email" | "password" | "uloga";

export type AuthState = {
  /** Greška koja se tiče cele forme (pogrešni podaci, zauzeta adresa, pad servisa). */
  error?: string;
  /** Greška uz konkretno polje, ispod njega. */
  fieldErrors?: Partial<Record<Polje, string>>;
  /**
   * Šta je korisnik uneo, da se forma ne isprazni posle neuspeha.
   *
   * Bez JavaScripta je odgovor servera nova stranica — sve otkucano bi nestalo.
   * Lozinka se ovde NIKAD ne vraća: završila bi u HTML-u stranice, u istoriji
   * pretraživača i u svakom međuskladištu na putu.
   */
  values?: Partial<Record<Exclude<Polje, "password">, string>>;
};

/**
 * Poruke su namerno NEODREĐENE kod pogrešnih podataka.
 *
 * „Ne postoji nalog sa tim mejlom" napadaču potvrđuje koje adrese su
 * registrovane — to je enumeracija korisnika. Zato i pogrešan mejl i pogrešna
 * lozinka daju istu poruku.
 */
const PORUKE: Record<string, string> = {
  /* Prijava */
  INVALID_EMAIL_OR_PASSWORD: "Pogrešna e-pošta ili lozinka.",
  INVALID_PASSWORD: "Pogrešna e-pošta ili lozinka.",
  USER_EMAIL_NOT_FOUND: "Pogrešna e-pošta ili lozinka.",
  EMAIL_PASSWORD_DISABLED: "Prijava lozinkom trenutno nije dostupna.",

  /* Registracija */
  USER_ALREADY_EXISTS: "Nalog sa tom e-poštom već postoji.",
  /* Ovo je kod koji better-auth zaista vraća pri registraciji zauzetog mejla. */
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Nalog sa tom e-poštom već postoji.",
  INVALID_EMAIL: "Unesite ispravnu e-poštu.",
  PASSWORD_TOO_SHORT: "Lozinka mora da ima najmanje 8 znakova.",
  PASSWORD_TOO_LONG: "Lozinka je predugačka.",
  FAILED_TO_CREATE_USER: "Nalog nije mogao da se napravi. Pokušajte ponovo.",

  /* Sesija i verifikacija */
  FAILED_TO_CREATE_SESSION: "Prijava nije uspela. Pokušajte ponovo.",
  EMAIL_NOT_VERIFIED: "Potvrdite e-poštu pre prijave.",
  INVALID_TOKEN: "Veza je istekla ili nije ispravna.",

  /* Google */
  PROVIDER_NOT_FOUND: "Prijava preko Google naloga trenutno nije dostupna.",
  FAILED_TO_GET_USER_INFO: "Podaci sa Google naloga nisu mogli da se preuzmu.",
};

const OPSTA_GRESKA = "Došlo je do greške. Pokušajte ponovo.";

/**
 * Poruka za korisnika — UVEK na srpskom.
 *
 * Ranije je nepoznat kod padao na `error.message`, a to je tekst iz
 * better-auth-a na engleskom. Tako je „User already exists. Use another email."
 * stiglo do korisnika usred ćiriličnog sajta.
 *
 * Sad nepoznat kod daje opštu srpsku poruku, a pravi kod ide u log da bi se
 * dodao u mapu. Bolje je da korisnik vidi neodređeno objašnjenje na svom jeziku
 * nego precizno na tuđem — a mi dobijemo trag da to popravimo.
 */
function poruka(error: unknown): string {
  if (!(error instanceof APIError)) return OPSTA_GRESKA;

  const code = String(error.body?.code ?? "");
  const prevedena = PORUKE[code];
  if (prevedena) return prevedena;

  console.warn(`[auth] neprevedena greška: ${code || "(bez koda)"} — ${error.message}`);
  return OPSTA_GRESKA;
}

/**
 * Prva Zod poruka po polju.
 *
 * Zod vraća listu grešaka po polju; prikazuje se samo prva. Tri poruke ispod
 * jednog inputa niko ne čita, a prva je ionako ona koju treba prvo ispraviti.
 */
function greskePolja(error: z.ZodError): Partial<Record<Polje, string>> {
  /*
   * `flattenError` bez generičkog tipa vraća prazan oblik, jer ne zna šemu iz
   * koje greška dolazi. Ovde je oblik uvek isti — mapa polje → lista poruka.
   */
  const fieldErrors = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const out: Partial<Record<Polje, string>> = {};

  for (const [polje, poruke] of Object.entries(fieldErrors)) {
    const prva = poruke?.[0];
    if (prva) out[polje as Polje] = prva;
  }
  return out;
}

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: greskePolja(parsed.error),
      values: { email: String(formData.get("email") ?? "") },
    };
  }

  const { email, password } = parsed.data;

  /*
   * Odakle je čovek krenuo — npr. klik na srce sa liste majstora šalje ga ovamo
   * sa `?next=/moleri/beograd`. Vrednost se PROVERAVA: mora da bude putanja
   * unutar sajta, inače bi tuđi sajt kroz naš link vodio korisnika kod sebe.
   */
  const povratak = bezbedanPovratak(String(formData.get("next") ?? ""));

  let cilj = "/";

  try {
    const { user } = await auth.api.signInEmail({ body: { email, password } });

    /*
     * Odredište zavisi od uloge i od toga dokle je majstor stigao sa profilom.
     * Odluka se donosi TAČNO OVDE, jednom po prijavi — alternativa je middleware
     * koji istu proveru radi na svaki zahtev do kraja sesije.
     */
    cilj = povratak ?? await putanjaPoslePrijave({
      id: user.id,
      email: user.email,
      displayName: user.name,
      avatarUrl: user.image ?? null,
      role: ((user as { role?: string }).role as CurrentUser["role"]) ?? "USER",
    });
  } catch (error) {
    return { error: poruka(error), values: { email } };
  }

  /*
   * `redirect` baca izuzetak koji Next hvata, pa MORA biti van `try` bloka —
   * unutra bi ga `catch` progutao i prijava bi izgledala kao greška.
   */
  redirect(cilj);
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const uloga = String(formData.get("uloga") ?? "USER");
  /* Ime i uloga se vraćaju u formu i kad provera padne — lozinka nikad. */
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    uloga,
  };

  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    uloga: formData.get("uloga"),
  });

  if (!parsed.success) {
    return { fieldErrors: greskePolja(parsed.error), values };
  }

  const { name, email, password } = parsed.data;
  const kaoMajstor = parsed.data.uloga === "MAJSTOR";

  try {
    const result = await auth.api.signUpEmail({ body: { name, email, password } });

    /*
     * Uloga se postavlja ODVOJENO, posle registracije: u konfiguraciji je
     * `input: false`, pa se ne može poslati iz forme. Da može, svako bi mogao
     * da se registruje kao ADMIN.
     */
    if (kaoMajstor && result.user?.id) {
      await db.user.update({ where: { id: result.user.id }, data: { role: "MAJSTOR" } });
    }
  } catch (error) {
    return { error: poruka(error), values };
  }

  /* Majstor ide pravo na popunjavanje profila — nalog je tek prvi korak. */
  redirect(kaoMajstor ? "/registracija-majstora" : "/");
}

/**
 * Prijava preko Google naloga.
 *
 * Nije običan link: better-auth-ov `sign-in/social` je POST koji VRAĆA adresu
 * Google-ovog pristanka, ne preusmerava sam. Zato Server Action uzme tu adresu
 * i preusmeri korisnika. Dugme je `<form>` sa `formAction`, pa radi i bez
 * JavaScripta.
 *
 * `callbackURL` je fiksiran na naslovnu, a ne uzet iz forme — kad bi dolazio
 * spolja, tuđi sajt bi mogao da pošalje korisnika na `?callbackURL=zlonamerno`
 * i iskoristi našu prijavu za preusmeravanje (open redirect).
 */
export async function signInWithGoogleAction(): Promise<void> {
  const { url } = await auth.api.signInSocial({
    body: { provider: "google", callbackURL: "/" },
  });

  if (!url) throw new Error("Google prijava trenutno nije dostupna.");
  redirect(url);
}

export async function signOutAction(): Promise<void> {
  const { headers } = await import("next/headers");
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
