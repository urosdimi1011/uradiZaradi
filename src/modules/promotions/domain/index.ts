import { z } from "zod";
import { idSchema, moneySchema, timestampSchema } from "@/modules/shared/domain/primitives";

/**
 * Monetizacija nije u MVP opsegu, ali model postoji od prvog dana.
 * Naknadno ubacivanje plaćene promocije u već postojeći ranking je bolan refaktor,
 * a prazna tabela ne košta ništa.
 */
export const promotionPlacementSchema = z.enum([
  "HOME", // istaknuti na početnoj
  "CATEGORY", // vrh kategorije, svi gradovi
  "CATEGORY_CITY", // vrh kategorije u jednom gradu — najvrednije i najskuplje
  "SEARCH", // vrh rezultata pretrage
]);
export type PromotionPlacement = z.infer<typeof promotionPlacementSchema>;

export const promotionSchema = z.object({
  id: idSchema,
  majstorId: idSchema,
  placement: promotionPlacementSchema,
  categoryId: idSchema.nullable(),
  cityId: idSchema.nullable(),
  startsAt: timestampSchema,
  endsAt: timestampSchema,
  /** Veći broj = više pozicioniran među plaćenima. */
  priority: z.number().int(),
  pricePaid: moneySchema.nullable(),
  status: z.enum(["SCHEDULED", "ACTIVE", "EXPIRED", "CANCELLED"]),
});
export type Promotion = z.infer<typeof promotionSchema>;

/**
 * Redosled na listingu je uvek: plaćeni prvo, pa Bayesian ocena.
 * Plaćena mesta MORAJU biti vidljivo označena ("Промовисано") —
 * i zbog poverenja korisnika i zbog Zakona o oglašavanju.
 */
export const rankingWeights = {
  promotedBoost: 1_000_000,
  /** Sveži profili dobijaju mali podsticaj da ne bi bili nevidljivi bez ijedne recenzije. */
  newcomerGraceDays: 30,
  newcomerBoost: 0.15,
} as const;
