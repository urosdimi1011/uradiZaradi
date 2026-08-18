import { z } from "zod";
import { idSchema, localizedTextSchema, slugSchema } from "@/modules/shared/domain/primitives";

/**
 * Geografija je zaseban modul zato što je nosilac programatskog SEO-a:
 * kombinacija kategorija × grad × opština generiše landing stranice
 * tipa /moleri-beograd i /moleri-beograd/zvezdara.
 */

export const citySchema = z.object({
  id: idSchema,
  slug: slugSchema,
  name: localizedTextSchema,
  /**
   * Lokativ — oblik za „u Beogradu", „u Novom Sadu", „u Čačku".
   *
   * Čuva se, a ne izvodi pravilom: srpski lokativ ima previše izuzetaka
   * („Novi Sad" → „Novom Sadu", „Čačak" → „Čačku") da bi ga algoritam pogodio.
   * A naslov „Moleri u Beograd" je i gramatički pogrešan i promašuje upit koji
   * ljudi zaista kucaju — „moleri u beogradu".
   */
  nameLocative: localizedTextSchema,
  /** Okrug/region — koristi se za "majstori u okolini" kad grad nema pokrivenost. */
  region: localizedTextSchema,
  lat: z.number(),
  lng: z.number(),
  /** Broj stanovnika — koristi se za redosled gradova u navigaciji i sitemap prioritet. */
  population: z.number().int().positive(),
});
export type City = z.infer<typeof citySchema>;

export const municipalitySchema = z.object({
  id: idSchema,
  citySlug: slugSchema,
  slug: slugSchema,
  name: localizedTextSchema,
});
export type Municipality = z.infer<typeof municipalitySchema>;
