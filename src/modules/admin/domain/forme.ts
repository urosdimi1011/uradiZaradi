import { z } from "zod";

import { priceUnitSchema } from "@/modules/catalog/domain";

/**
 * Unos iz admin formi.
 *
 * Domen je izvor istine i ovde: forma ne sme da propusti ništa što `Category`
 * i `ServiceType` posle ne bi prihvatili.
 */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const PORUKE = {
  obavezno: "Ovo polje je obavezno.",
  slug: "Samo mala slova, brojevi i crtica — bez razmaka i kvačica.",
  intro: "Uvodni tekst mora imati bar 80 znakova, inače je stranica prazna za pretraživač.",
  jedinice: "Izaberite bar jednu mernu jedinicu.",
  podrazumevanaVanIzbora: "Podrazumevana jedinica mora biti među dozvoljenima.",
} as const;

const obavezanTekst = (poruka = PORUKE.obavezno) => z.string().trim().min(1, poruka);

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, PORUKE.obavezno)
  .max(60, PORUKE.slug)
  .regex(SLUG_RE, PORUKE.slug);

/** Prazan tekst iz forme je „nema vrednosti", ne prazan string. */
const opcioniTekst = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

export const kategorijaSchema = z.object({
  slug,
  nameLatn: obavezanTekst(),
  nameCyrl: obavezanTekst(),
  nameSingularLatn: obavezanTekst(),
  nameSingularCyrl: obavezanTekst(),
  icon: obavezanTekst(),
  /*
   * Uvodni tekst je jedino što kategorijsku stranicu deli od prazne liste.
   * Devet kategorija sa po jednom rečenicom je devet tankih stranica — najbrži
   * način da domen izgubi poverenje pretraživača.
   */
  introLatn: z.string().trim().min(80, PORUKE.intro),
  introCyrl: z.string().trim().min(80, PORUKE.intro),
  seoTitle: opcioniTekst,
  seoDescription: opcioniTekst,
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.coerce.boolean(),
});
export type KategorijaUnos = z.infer<typeof kategorijaSchema>;

export const uslugaSchema = z
  .object({
    slug,
    categoryId: obavezanTekst(),
    nameLatn: obavezanTekst(),
    nameCyrl: obavezanTekst(),
    defaultUnit: priceUnitSchema,
    allowedUnits: z.array(priceUnitSchema).min(1, PORUKE.jedinice),
    sortOrder: z.coerce.number().int().min(0).max(999),
    isActive: z.coerce.boolean(),
  })
  /*
   * Podrazumevana jedinica MORA biti među dozvoljenima. Bez ove provere majstor
   * dobije formular u kom je unapred izabrana jedinica koju ne sme da izabere —
   * i ne može da sačuva cenu, a da mu niko ne kaže zašto.
   */
  .refine((u) => u.allowedUnits.includes(u.defaultUnit), {
    message: PORUKE.podrazumevanaVanIzbora,
    path: ["defaultUnit"],
  });
export type UslugaUnos = z.infer<typeof uslugaSchema>;

/** Beleška moderatora — prazno znači brisanje beleške. */
export const beleskaSchema = z.object({
  reviewId: obavezanTekst(),
  note: z.string().trim().max(1000, "Najviše 1000 znakova."),
});
