import "server-only";
import { z } from "zod";

import citiesJson from "./cities.json";
import municipalitiesJson from "./municipalities.json";
import categoriesJson from "./categories.json";
import serviceTypesJson from "./service-types.json";
import majstoriJson from "./majstori.json";
import majstorStatsJson from "./majstor-stats.json";
import reviewsJson from "./reviews.json";

import { citySchema, municipalitySchema } from "@/modules/geo/domain";
import { categorySchema, serviceTypeSchema } from "@/modules/catalog/domain";
import { majstorSchema, majstorStatsSchema } from "@/modules/majstori/domain";
import { reviewSchema } from "@/modules/reviews/domain";

/**
 * Jedini fajl u aplikaciji koji zna da podaci trenutno dolaze iz JSON-a.
 *
 * Zod parse ovde nije ceremonija — on je test: ako seed odstupi od domenskog modela,
 * build pukne odmah umesto da se greška pojavi kao `undefined` u UI-ju.
 * U Fazi 1 ovaj modul nestaje, a repozitorijumi počinju da zovu Prismu.
 */
function parse<T extends z.ZodType>(schema: T, data: unknown, name: string): z.infer<T>[] {
  const result = z.array(schema).safeParse(data);
  if (!result.success) {
    throw new Error(
      `Seed "${name}" ne odgovara domenskom modelu:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

export const db = {
  cities: parse(citySchema, citiesJson, "cities"),
  municipalities: parse(municipalitySchema, municipalitiesJson, "municipalities"),
  categories: parse(categorySchema, categoriesJson, "categories"),
  serviceTypes: parse(serviceTypeSchema, serviceTypesJson, "service-types"),
  majstori: parse(majstorSchema, majstoriJson, "majstori"),
  majstorStats: parse(majstorStatsSchema, majstorStatsJson, "majstor-stats"),
  reviews: parse(reviewSchema, reviewsJson, "reviews"),
};
