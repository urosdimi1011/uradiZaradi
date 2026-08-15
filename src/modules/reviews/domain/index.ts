import { z } from "zod";
import { idSchema, timestampSchema } from "@/modules/shared/domain/primitives";

export const reviewStatusSchema = z.enum([
  "PENDING", // default — nijedna recenzija se ne objavljuje bez moderacije
  "PUBLISHED",
  "REJECTED",
  "HIDDEN", // bila objavljena pa sklonjena
]);
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;

export const reviewReplySchema = z.object({
  body: z.string().min(2).max(1000),
  createdAt: timestampSchema,
});
export type ReviewReply = z.infer<typeof reviewReplySchema>;

/**
 * Integritet recenzija je najveći poslovni rizik projekta.
 * Bez poruka i rezervacija u MVP-u nema dokaza da je posao obavljen, pa važi:
 *   - samo ulogovan nalog sa potvrđenim mejlom,
 *   - jedna recenzija po korisniku po majstoru (unique constraint),
 *   - sve ide kroz moderaciju pre objave,
 *   - majstor ima pravo na javni odgovor.
 * Kad se uvedu poruke/rezervacije, dodaje se `isVerifiedJob` značka.
 */
export const reviewSchema = z.object({
  id: idSchema,
  majstorId: idSchema,
  authorUserId: idSchema,
  /** Prikazuje se skraćeno ("Милан Л.") — puno ime se ne objavljuje. */
  authorDisplayName: z.string().min(2).max(60),
  authorAvatarUrl: z.url().nullable(),

  rating: z.number().int().min(1).max(5),
  body: z.string().min(10).max(2000),
  /** Za koju uslugu — omogućava "ocene po usluzi" kasnije. */
  serviceTypeId: idSchema.nullable(),

  status: reviewStatusSchema,
  reply: reviewReplySchema.nullable(),

  createdAt: timestampSchema,
  moderatedAt: timestampSchema.nullable(),
  moderatorId: idSchema.nullable(),
});
export type Review = z.infer<typeof reviewSchema>;

/**
 * Bayesian prosek (Bayesian average).
 *
 *   score = (v / (v + m)) * R + (m / (v + m)) * C
 *
 * R = prosek majstora, v = broj njegovih recenzija,
 * C = globalni prosek platforme, m = prag poverenja.
 *
 * Efekat: majstor sa 1 recenzijom ocene 5.0 se vuče ka globalnom proseku,
 * dok majstor sa 127 recenzija ocene 4.9 ostaje skoro nepromenjen.
 */
export const BAYESIAN_CONFIDENCE_THRESHOLD = 10;

export function bayesianScore(
  average: number,
  count: number,
  globalAverage: number,
  threshold: number = BAYESIAN_CONFIDENCE_THRESHOLD,
): number {
  if (count <= 0) return globalAverage;
  return (count / (count + threshold)) * average + (threshold / (count + threshold)) * globalAverage;
}
