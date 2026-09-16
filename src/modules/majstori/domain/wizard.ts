import { z } from "zod";

import { normalizujTelefon } from "./telefon";

/**
 * Pravila za popunjavanje majstorskog profila.
 *
 * Svaki korak ima svoju šemu, jer se svaki snima zasebno. Da je šema jedna za
 * ceo čarobnjak, ne bi se moglo snimiti pola profila — a upravo to je poenta:
 * čovek koji zatvori karticu na trećem koraku mora da nastavi odatle, ne iz
 * početka.
 *
 * Sve šeme rade NA SERVERU, u Server Action-u. Podaci idu POST-om, u telu
 * zahteva; ništa o osobi ne završava u adresi.
 */

/*
 * ── Izrazi ──
 *
 * Kao i kod prijave: telo bez sidara, jer HTML `pattern` sam sidri, a Zod ne.
 * Isti izraz radi u pretraživaču (trenutna povratna informacija) i na serveru
 * (stvarna provera).
 */

/** Ime pod kojim se majstor prikazuje — lično ime ili naziv radnje. */
const IME_BODY = String.raw`[\p{L}\p{N}][\p{L}\p{M}\p{N}\s'’.&\-]{1,59}`;

/**
 * Unos telefona.
 *
 * Namerno labav: propušta sve oblike koje ljudi kucaju, a pravu proveru radi
 * `normalizujTelefon`. Strog izraz ovde bi odbijao tačne brojeve zbog crtice
 * na pogrešnom mestu.
 *
 * Zagrade, kosa crta i tačka MORAJU biti izbegnute: pretraživač `pattern`
 * kompajlira sa `v` zastavicom, koja je strožija od `u` i takve znakove u
 * klasi ne prima. Neispravan izraz pretraživač tiho preskoči — provera onda
 * nestane, a da niko ne primeti.
 */
const TELEFON_BODY = String.raw`[\d\s\-\/\(\)\+\.]{9,20}`;

export const IME_RE = new RegExp(`^${IME_BODY}$`, "u");

export const PATTERNS = {
  ime: String.raw`\s*${IME_BODY}\s*`,
  telefon: TELEFON_BODY,
} as const;

export const NAJVISE_DODATNIH_ZANATA = 5;

export const PORUKE = {
  ime: {
    required: "Unesite ime pod kojim želite da se prikazujete.",
    tooShort: "Ime mora da ima bar 2 znaka.",
    tooLong: "Ime je predugačko.",
    pattern: "Ime sme da sadrži slova, brojeve, razmak, crticu i apostrof.",
  },
  telefon: {
    required: "Unesite broj telefona.",
    pattern: "Unesite ispravan broj, na primer 064 123 4567.",
  },
  kategorija: { required: "Izaberite zanat kojim se bavite." },
  grad: { required: "Izaberite grad u kom radite." },
} as const;

/**
 * Korak 1 — zanat, lokacija i telefon.
 *
 * Telefon je baš ovde, a ne na kraju, iz jednog razloga: `Majstor.phone` je
 * `@unique`. Ako je broj već zauzet, čovek to mora da sazna pre nego što uloži
 * dvadeset minuta u opis i fotografije, a ne posle.
 *
 * Ovaj korak je jedini koji KREIRA `Majstor` red (`status: DRAFT`). Od tog
 * trenutka se sve dalje samo dopunjuje, pa zatvaranje kartice ništa ne košta.
 */
export const korak1Schema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, PORUKE.ime.tooShort)
    .max(60, PORUKE.ime.tooLong)
    .regex(IME_RE, PORUKE.ime.pattern),

  /*
   * `transform` umesto `regex`: broj se ne proverava u zatečenom obliku nego se
   * svodi na kanonski, pa se proverava rezultat. Tako u bazu uvek ulazi jedan
   * isti zapis, bez obzira kako je otkucan.
   */
  phone: z
    .string()
    .trim()
    .min(1, PORUKE.telefon.required)
    .transform((unos, ctx) => {
      const kanonski = normalizujTelefon(unos);
      if (!kanonski) {
        ctx.addIssue({ code: "custom", message: PORUKE.telefon.pattern });
        return z.NEVER;
      }
      return kanonski;
    }),

  primaryCategoryId: z.string().min(1, PORUKE.kategorija.required),

  /*
   * Dodatni zanati. Majstor se pojavljuje u listingu SVAKOG od njih, a glavni
   * ostaje onaj koji piše na kartici i stoji u adresi profila.
   *
   * Zašto glavni nije prosto „prvi izabrani": adresa profila se pravi od njega
   * i posle se ne menja. Kad bi se izvodio iz redosleda čekiranja, majstor bi
   * odčekiranjem jedne kućice promenio ono što Google već ima zapisano.
   */
  dodatneKategorije: z
    .array(z.string().min(1))
    .max(NAJVISE_DODATNIH_ZANATA, `Najviše ${NAJVISE_DODATNIH_ZANATA} dodatnih zanata.`)
    /* Nijedna čekirana kućica ne šalje polje uopšte — prazan spisak je uredan ulaz. */
    .default([]),
  cityId: z.string().min(1, PORUKE.grad.required),

  /*
   * Deo grada je neobavezan: postoji samo u četiri grada, a i tamo ga majstor
   * ne mora izabrati. Prazan string iz `<select>` se pretvara u `null`, jer
   * strana tastera ne razlikuje „nije izabrano" od „izabrano prazno".
   */
  municipalityId: z
    .string()
    .trim()
    .transform((vrednost) => vrednost || null)
    .nullable(),
});

export type Korak1Ulaz = z.input<typeof korak1Schema>;
export type Korak1 = z.output<typeof korak1Schema>;

/**
 * Korak 2 — usluge i cene.
 *
 * Jedna stavka je jedna usluga koju majstor radi. Cena je NEOBAVEZNA: `null`
 * znači „po dogovoru", što je za pola poslova jedini pošten odgovor. Obavezna
 * cena bi naterala ljude da izmišljaju brojeve, a izmišljena cena je gora od
 * nikakve — kupac je uzme kao obećanje.
 *
 * Jedinica se NE proverava ovde nego u akciji, jer dozvoljeni skup zavisi od
 * usluge i stoji u bazi (`ServiceType.allowedUnits`). Šema proverava oblik;
 * akcija proverava da li ta jedinica sme baš uz tu uslugu.
 */
export const stavkaSchema = z.object({
  serviceTypeId: z.string().min(1),
  priceFromMinor: z.number().int().positive().nullable(),
  unit: z.enum(["M2", "M1", "SAT", "DAN", "KOMAD", "PO_DOGOVORU"]),
});

export const korak2Schema = z.object({
  stavke: z
    .array(stavkaSchema)
    /*
     * Bar jedna usluga: majstor bez ijedne ne može da se pojavi ni u jednom
     * filteru, pa bi objavljen profil bio nevidljiv a da on ne zna zašto.
     */
    .min(1, "Izaberite bar jednu uslugu koju radite.")
    .max(40, "Izabrali ste previše usluga."),
});

export type Stavka = z.infer<typeof stavkaSchema>;

/**
 * Korak 3 — profil.
 *
 * Opis je jedino obavezno polje. Donja granica od 200 znakova nije hir: kratak
 * opis pravi stranicu koju Google vidi kao „thin content" i ne rangira je, pa
 * majstor plaća profil koji ga ne dovodi ni do koga. Isti prag već stoji u
 * `INDEXABILITY_THRESHOLD`.
 */
export const OPIS_NAJMANJE = 200;
export const OPIS_NAJVISE = 2000;

export const korak3Schema = z.object({
  bio: z
    .string()
    .trim()
    .min(OPIS_NAJMANJE, `Opis mora da ima najmanje ${OPIS_NAJMANJE} znakova.`)
    .max(OPIS_NAJVISE, `Opis ne sme da pređe ${OPIS_NAJVISE} znakova.`),

  /*
   * Godine iskustva su neobavezne. Prazno polje je pošteniji odgovor od nule,
   * pa se prazno čuva kao `null` umesto da se tumači kao „nema iskustva".
   */
  yearsExperience: z
    .string()
    .trim()
    .transform((vrednost, ctx) => {
      if (!vrednost) return null;
      const broj = Number(vrednost);
      if (!Number.isInteger(broj) || broj < 0 || broj > 70) {
        ctx.addIssue({ code: "custom", message: "Unesite broj godina između 0 i 70." });
        return z.NEVER;
      }
      return broj;
    })
    .nullable(),
});

/** Koraci čarobnjaka, redom. Segment u URL-u je isti ovaj ključ. */
export const KORACI = [
  { segment: "zanat", naslov: "Zanat i lokacija" },
  { segment: "usluge", naslov: "Usluge i cene" },
  { segment: "profil", naslov: "Profil" },
  { segment: "objava", naslov: "Objava" },
] as const;

export type KorakSegment = (typeof KORACI)[number]["segment"];

export function jeKorak(vrednost: string): vrednost is KorakSegment {
  return KORACI.some((korak) => korak.segment === vrednost);
}
