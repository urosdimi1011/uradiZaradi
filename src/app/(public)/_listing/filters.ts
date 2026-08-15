import "server-only";

import { catalogRepository } from "@/modules/catalog/repository";
import { geoRepository } from "@/modules/geo/repository";
import type { MajstorQuery } from "@/modules/majstori/repository";

/**
 * Jedno mesto na kom se URL parametri prevode u upit nad repozitorijumom.
 *
 * Deli ga stranica sa listom i Server Action koji broji rezultate uživo. Da su
 * parsirali svaki za sebe, brojka na dugmetu bi pre ili kasnije prestala da se
 * poklapa sa onim što se prikaže posle klika — a to je gore nego da brojke nema.
 */
export type ListingSearchParams = Record<string, string | string[] | undefined>;

export function one(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.length ? v : undefined;
}

export function many(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

/**
 * Prag ocene po štikliranoj opciji.
 *
 * "5" NIJE 5.0 nego 4.5: kartica prikazuje pet punih zvezdica već za 4.9
 * (`Math.round`), pa bi doslovno tumačenje značilo da filter "5 ★" uvek vraća
 * prazno — najbolji majstor na platformi ima 4.9.
 */
const RATING_THRESHOLD: Record<string, number> = { "5": 4.5, "4": 4, "3": 3 };

/**
 * Opcije se preklapaju ("4+" sadrži i "5"), pa više štikliranih znači uniju —
 * uzima se NAJNIŽI prag. Da se uzimao najviši, kombinacija "5" + "3+" vratila bi
 * manje rezultata nego samo "3+", što nijedan korisnik ne očekuje.
 */
function minRatingFrom(values: string[]): number | undefined {
  const thresholds = values
    .map((v) => RATING_THRESHOLD[v])
    .filter((n): n is number => n !== undefined);
  return thresholds.length ? Math.min(...thresholds) : undefined;
}

export type ListingFilters = ReturnType<typeof parseFilters>;

export function parseFilters(params: ListingSearchParams) {
  return {
    q: one(params.q),
    usluga: many(params.usluga),
    grad: one(params.grad),
    cenaOd: one(params.cenaOd),
    cenaDo: one(params.cenaDo),
    ocena: many(params.ocena),
    verifikovani: one(params.verifikovani),
    sort: one(params.sort),
    strana: one(params.strana),
  };
}

/**
 * Samo ukupan broj rezultata.
 *
 * Stranica ga treba pre nego što se mreža učita (dugme „Primeni filtere (N)"),
 * pa se broji odvojeno od same liste. U Fazi 1 to je `SELECT count(*)`, koji je
 * i inače potreban za paginaciju.
 */
export async function countMajstori(
  filters: ListingFilters,
  categorySlug: string | null,
): Promise<number> {
  const { majstorRepository } = await import("@/modules/majstori/repository");
  const query = await toMajstorQuery(filters, categorySlug, 1, 1);
  const { total } = await majstorRepository.search(query);
  return total;
}

/** Slugovi iz URL-a → interni ID-jevi. URL je javni ugovor, ID-jevi nisu. */
export async function toMajstorQuery(
  filters: ListingFilters,
  categorySlug: string | null,
  page: number,
  perPage: number,
): Promise<MajstorQuery> {
  const category = categorySlug ? await catalogRepository.findCategoryBySlug(categorySlug) : null;
  const city = filters.grad ? await geoRepository.findCityBySlug(filters.grad) : null;

  const services = category ? await catalogRepository.listServiceTypes(category.id) : [];
  const serviceTypeIds = services
    .filter((s) => filters.usluga.includes(s.slug))
    .map((s) => s.id);

  return {
    q: filters.q,
    categoryId: category?.id,
    serviceTypeIds,
    cityId: city?.id,
    minRating: minRatingFrom(filters.ocena),
    priceFromMinor: filters.cenaOd ? Number(filters.cenaOd) * 100 : undefined,
    priceToMinor: filters.cenaDo ? Number(filters.cenaDo) * 100 : undefined,
    verifiedOnly: filters.verifikovani === "1",
    sort:
      filters.sort === "rating" || filters.sort === "priceAsc"
        ? filters.sort
        : "newest",
    page,
    perPage,
  };
}
