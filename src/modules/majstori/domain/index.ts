import { z } from "zod";
import { priceUnitSchema } from "@/modules/catalog/domain";
import {
  currencySchema,
  idSchema,
  seoMetaSchema,
  slugSchema,
  timestampSchema,
} from "@/modules/shared/domain/primitives";

/**
 * Nivoi verifikacije. SMS OTP dokazuje samo da neko poseduje broj telefona —
 * zato žuta kvačica iz mockupa NIJE nivo PHONE nego IDENTITY.
 * U MVP-u IDENTITY dodeljuje admin ručno (poziv majstoru), bez troška SMS gateway-a.
 */
export const verificationLevelSchema = z.enum([
  "NONE",
  "EMAIL", // potvrđen email
  "PHONE", // + SMS OTP
  "IDENTITY", // + provereno lice/firma (PIB ili matični broj) → javna kvačica
]);
export type VerificationLevel = z.infer<typeof verificationLevelSchema>;

export const majstorStatusSchema = z.enum([
  "DRAFT", // profil se popunjava, nije javan
  "PENDING_REVIEW", // čeka admina
  "ACTIVE",
  "SUSPENDED", // privremeno skriven
  "BANNED",
]);
export type MajstorStatus = z.infer<typeof majstorStatusSchema>;

/** Ikonice ispod opisa u mockupu ("10+ godina iskustva", "Profesionalan alat", "Garancija na rad"). */
export const majstorBadgeSchema = z.enum([
  "PRO_TOOLS",
  "WARRANTY",
  "INVOICE", // izdaje račun
  "EMERGENCY", // hitne intervencije 24/7
]);
export type MajstorBadge = z.infer<typeof majstorBadgeSchema>;

export const majstorServiceSchema = z.object({
  id: idSchema,
  majstorId: idSchema,
  serviceTypeId: idSchema,
  /**
   * Cena je uvek "od" — mockup svuda piše "Од 8€/m²".
   * null znači PO_DOGOVORU; tada se `unit` ignoriše u prikazu.
   */
  priceFromMinor: z.number().int().nonnegative().nullable(),
  currency: currencySchema,
  unit: priceUnitSchema,
  note: z.string().max(200).optional(),
  sortOrder: z.number().int(),
});
export type MajstorService = z.infer<typeof majstorServiceSchema>;

export const workPhotoSchema = z.object({
  id: idSchema,
  url: z.url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Obavezan alt — pristupačnost i image search su deo SEO plana. */
  alt: z.string().min(3).max(160),
  caption: z.string().max(200).optional(),
  sortOrder: z.number().int(),
});
export type WorkPhoto = z.infer<typeof workPhotoSchema>;

export const ratingSummarySchema = z.object({
  average: z.number().min(0).max(5),
  count: z.number().int().nonnegative(),
  /** Histogram sa mockupa: 5★ → 105, 4★ → 18, ... */
  distribution: z.record(z.enum(["1", "2", "3", "4", "5"]), z.number().int().nonnegative()),
  /**
   * Bayesian prosek — jedini ispravan ključ za sortiranje.
   * Sirov prosek bi majstora sa jednom peticom stavio iznad onog sa 4.9 i 127 recenzija.
   */
  bayesianScore: z.number().min(0).max(5),
});
export type RatingSummary = z.infer<typeof ratingSummarySchema>;

export const majstorSchema = z.object({
  id: idSchema,
  slug: slugSchema, // npr. "marko-petrovic-moler-beograd"
  userId: idSchema,

  displayName: z.string().min(2).max(60),
  primaryCategoryId: idSchema,
  /** Majstor može da pokriva više kategorija; prva je uvek primarna. */
  categoryIds: z.array(idSchema).min(1),

  bio: z.string().max(3000),
  avatarUrl: z.url().nullable(),

  cityId: idSchema,
  municipalityId: idSchema.nullable(),
  /** Gradovi u kojima radi pored matičnog — utiče na to gde se pojavljuje u pretrazi. */
  servesCityIds: z.array(idSchema),

  /** Nikad se ne šalje na klijent u punom obliku dok korisnik ne klikne "Prikaži broj". */
  phone: z.string().min(6).max(20),
  yearsExperience: z.number().int().min(0).max(70).nullable(),
  badges: z.array(majstorBadgeSchema),

  verificationLevel: verificationLevelSchema,
  status: majstorStatusSchema,

  services: z.array(majstorServiceSchema),
  gallery: z.array(workPhotoSchema),
  rating: ratingSummarySchema,

  seo: seoMetaSchema,

  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  publishedAt: timestampSchema.nullable(),
});
export type Majstor = z.infer<typeof majstorSchema>;

/** Denormalizovani brojači — odvojeni od profila jer se pišu često i ne smeju da invalidiraju ISR keš. */
export const majstorStatsSchema = z.object({
  majstorId: idSchema,
  profileViews: z.number().int().nonnegative(),
  phoneReveals: z.number().int().nonnegative(),
  messageCount: z.number().int().nonnegative(),
});
export type MajstorStats = z.infer<typeof majstorStatsSchema>;

/**
 * Prag ispod kog profil ide u `noindex`.
 *
 * Bez ovoga stotine šablonskih profila postaju thin content i Google kažnjava
 * ceo domen — klasičan način na koji marketplace sajtovi ubiju sopstveni SEO.
 */
export const INDEXABILITY_THRESHOLD = {
  minBioLength: 200,
  minGalleryPhotos: 3,
  minServices: 1,
} as const;

export function isMajstorIndexable(majstor: Majstor): boolean {
  return (
    majstor.status === "ACTIVE" &&
    majstor.bio.trim().length >= INDEXABILITY_THRESHOLD.minBioLength &&
    majstor.gallery.length >= INDEXABILITY_THRESHOLD.minGalleryPhotos &&
    majstor.services.length >= INDEXABILITY_THRESHOLD.minServices
  );
}

/** Koliko je profil popunjen — pokreće progress bar koji tera majstore da pišu svoj tekst. */
export function profileCompleteness(majstor: Majstor): number {
  const checks = [
    majstor.avatarUrl !== null,
    majstor.bio.trim().length >= INDEXABILITY_THRESHOLD.minBioLength,
    majstor.gallery.length >= INDEXABILITY_THRESHOLD.minGalleryPhotos,
    majstor.services.length >= INDEXABILITY_THRESHOLD.minServices,
    majstor.municipalityId !== null,
    majstor.yearsExperience !== null,
    majstor.verificationLevel === "PHONE" || majstor.verificationLevel === "IDENTITY",
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
