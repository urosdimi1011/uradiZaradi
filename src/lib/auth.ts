import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/lib/db";

/**
 * Autentifikacija.
 *
 * Mejl + lozinka je osnova, Google je dodatak. Magic link namerno NIJE uključen:
 * majstori retko otvaraju mejl, a magic link bi ih terao u inbox pri svakoj
 * prijavi. Lozinka je za tu publiku poznatija, koliko god delovala staromodno.
 *
 * Telefon kao način prijave dolazi kasnije — majstoru je broj primarni identitet
 * i već ga ima na profilu. Odloženo samo zato što SMS košta.
 */

/**
 * Google se registruje SAMO ako postoje ključevi.
 *
 * Tako razvoj radi bez naloga na Google Cloud Console-u: mejl i lozinka rade
 * odmah, a dugme za Google se pojavi tek kad ključevi uđu u `.env`. Bez ovoga
 * bi better-auth pucao na startu zbog praznih vrednosti.
 */
const googleId = process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_CLIENT_SECRET;

export const isGoogleEnabled = Boolean(googleId && googleSecret);

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    /*
     * Potvrda mejla još ne blokira prijavu — nema servisa za slanje pošte.
     * Kad uđe Resend, ovo se prebacuje na `true` i registracija šalje link.
     */
    requireEmailVerification: false,
  },

  socialProviders: isGoogleEnabled
    ? { google: { clientId: googleId!, clientSecret: googleSecret! } }
    : {},

  /**
   * Naš `User` model je stariji od biblioteke i domen mu diktira imena polja.
   * Umesto da preimenujem domen zbog biblioteke, mapiram kolone — better-auth
   * traži `name`, `emailVerified` i `image`.
   */
  user: {
    /*
     * BEZ `modelName`. Prisma klijent izlaže modele malim slovom (`db.user`),
     * pa bi "User" naterao adapter da traži `db.User` — što ne postoji, i sve
     * puca sa „missing table" iako tabela u bazi uredno stoji.
     */
    /*
     * `emailVerified` se NE mapira na `emailVerifiedAt`: biblioteka očekuje
     * boolean, a naša kolona je datum. Kolone stoje jedna pored druge.
     */
    fields: {
      name: "displayName",
      image: "avatarUrl",
    },
    additionalFields: {
      /* Uloga se postavlja pri registraciji i ne sme da se menja sa klijenta. */
      role: { type: "string", defaultValue: "USER", input: false },
      status: { type: "string", defaultValue: "ACTIVE", input: false },
    },
  },

  /**
   * Sesije u BAZI, ne JWT.
   *
   * Admin mora da može da banuje majstora i da on istog trena ispadne. Sa
   * JWT-om banovan korisnik ostaje prijavljen dok mu token ne istekne — kod
   * marketplace-a sa moderacijom to nije prihvatljivo.
   */
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },


  /*
   * `nextCookies` mora da bude POSLEDNJI plugin. Bez njega Server Action ne može
   * da postavi cookie sesije, pa prijava „uspe" a korisnik ostane odjavljen.
   */
  plugins: [nextCookies()],

  advanced: {
    database: {
      /* Naš `User.id` je `cuid()`; neka i ostale tabele koriste isti oblik. */
      generateId: false,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
