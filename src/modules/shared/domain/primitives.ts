import { z } from "zod";

/**
 * Slug je uvek latinica bez dijakritike — koristi se u URL-ovima na oba pisma.
 * Ćirilična verzija sajta prikazuje ćirilični tekst, ali URL ostaje isti.
 */
export const slugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug sme da sadrži samo mala latinična slova, cifre i crticu");

export const idSchema = z.string().min(1);

/**
 * Svaki tekst vidljiv korisniku postoji u obe varijante pisma.
 * Latinica je izvor istine; ćirilica se generiše transliteracijom i ručno koriguje
 * tamo gde transliteracija nije dovoljna.
 */
export const localizedTextSchema = z.object({
  latn: z.string().min(1),
  cyrl: z.string().min(1),
});
export type LocalizedText = z.infer<typeof localizedTextSchema>;

/**
 * Novac se čuva u minor jedinicama (para) da bi se izbegao floating point.
 * RSD je jedina valuta u kojoj se cene čuvaju; € prikaz je izveden po dnevnom kursu.
 */
export const currencySchema = z.literal("RSD");

export const moneySchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  currency: currencySchema,
});
export type Money = z.infer<typeof moneySchema>;

export const seoMetaSchema = z.object({
  title: z.string().max(70).optional(),
  description: z.string().max(160).optional(),
});
export type SeoMeta = z.infer<typeof seoMetaSchema>;

/** Prihvata i ISO string (JSON seed) i Date (Prisma) — isti domen radi u obe faze. */
export const timestampSchema = z.coerce.date();
