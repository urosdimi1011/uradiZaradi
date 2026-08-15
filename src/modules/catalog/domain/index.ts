import { z } from "zod";
import {
  idSchema,
  localizedTextSchema,
  seoMetaSchema,
  slugSchema,
} from "@/modules/shared/domain/primitives";

/**
 * Merna jedinica je vezana za USLUGU, ne za kategoriju i ne za majstora.
 *
 * Zašto ne za kategoriju: moler farba zidove po m², ali montira karnišu po komadu.
 * Zašto ne slobodan unos majstora: za tri meseca bi postojalo 40 varijanti
 * "krečenje / Krecenje zidova / kречење", što razbija i pretragu i SEO agregaciju cena.
 */
export const priceUnitSchema = z.enum([
  "M2", // kvadratni metar — molerski, keramičarski, podopolagački radovi
  "M1", // dužni metar — lajsne, oluci, ograde
  "SAT", // sat rada — elektro, vodoinstalaterske intervencije
  "DAN", // dnevnica — građevinski radovi
  "KOMAD", // po jedinici — bojler, utičnica, klima uređaj
  "PO_DOGOVORU", // bez javne cene — vidi "Декоративне технике" u mockupu
]);
export type PriceUnit = z.infer<typeof priceUnitSchema>;

export const PRICE_UNIT_LABEL: Record<PriceUnit, { latn: string; cyrl: string }> = {
  M2: { latn: "m²", cyrl: "m²" },
  M1: { latn: "m", cyrl: "m" },
  SAT: { latn: "sat", cyrl: "сат" },
  DAN: { latn: "dan", cyrl: "дан" },
  KOMAD: { latn: "kom.", cyrl: "ком." },
  PO_DOGOVORU: { latn: "po dogovoru", cyrl: "по договору" },
};

export const categorySchema = z.object({
  id: idSchema,
  slug: slugSchema,
  name: localizedTextSchema,
  /** Jednina — za naslove profila ("Moler"), dok je `name` množina ("Moleri"). */
  nameSingular: localizedTextSchema,
  /** Ime ikone iz lucide-react seta. */
  icon: z.string().min(1),
  /** Uvodni tekst kategorijske stranice — mora biti jedinstven zbog thin-content rizika. */
  intro: localizedTextSchema,
  seo: seoMetaSchema,
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});
export type Category = z.infer<typeof categorySchema>;

export const serviceTypeSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  categoryId: idSchema,
  name: localizedTextSchema,
  defaultUnit: priceUnitSchema,
  /** Dozvoljene jedinice — majstor bira, ali samo iz smislenog podskupa. */
  allowedUnits: z.array(priceUnitSchema).min(1),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});
export type ServiceType = z.infer<typeof serviceTypeSchema>;

/**
 * Majstor može da predloži uslugu koje nema u katalogu; admin je odobrava
 * i tek tada ulazi u `ServiceType`. Katalog raste organski, a ostaje čist.
 */
export const serviceTypeProposalSchema = z.object({
  id: idSchema,
  majstorId: idSchema,
  categoryId: idSchema,
  proposedName: z.string().min(3).max(80),
  proposedUnit: priceUnitSchema,
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});
export type ServiceTypeProposal = z.infer<typeof serviceTypeProposalSchema>;
