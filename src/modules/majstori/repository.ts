import "server-only";
import { db } from "@/data";
import { normalizeForSearch } from "@/lib/translit";
import type { Majstor, MajstorStats } from "./domain";

export type MajstorQuery = {
  categoryId?: string;
  /**
   * Konkretne usluge unutar kategorije. Više izabranih znači ILI — majstor je
   * relevantan ako radi bilo koju od njih. Presek bi bio besmislen: niko ne traži
   * majstora koji radi i gletovanje i dekorativne tehnike, nego bar jedno od toga.
   */
  serviceTypeIds?: string[];
  cityId?: string;
  municipalityId?: string;
  /** Slobodan tekst — u Fazi 1 postaje Postgres full-text + pg_trgm. */
  q?: string;
  minRating?: number;
  priceFromMinor?: number;
  priceToMinor?: number;
  verifiedOnly?: boolean;
  sort?: "newest" | "rating" | "priceAsc";
  page?: number;
  perPage?: number;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

const cheapestPrice = (m: Majstor): number | null => {
  const prices = m.services
    .map((s) => s.priceFromMinor)
    .filter((p): p is number => p !== null);
  return prices.length ? Math.min(...prices) : null;
};

/**
 * Tekst po kom se pretražuje. Pored imena i opisa OBAVEZNO ulaze naziv zanata,
 * nazivi usluga i lokacija — najčešći upit nije ime majstora nego
 * "keramicar novi sad" ili "krecenje zvezdara".
 *
 * Računa se jednom po majstoru i kešira, jer bi inače svaki upit iznova
 * gradio isti string za svih 15 (kasnije: hiljade) profila.
 */
const haystackCache = new Map<string, string>();

function haystack(m: Majstor): string {
  const cached = haystackCache.get(m.id);
  if (cached) return cached;

  const category = db.categories.find((c) => c.id === m.primaryCategoryId);
  const serviceNames = m.services
    .map((s) => db.serviceTypes.find((t) => t.id === s.serviceTypeId))
    .flatMap((t) => (t ? [t.name.latn, t.name.cyrl] : []));
  const city = db.cities.find((c) => c.id === m.cityId);
  const municipality = db.municipalities.find((mun) => mun.id === m.municipalityId);

  const value = normalizeForSearch(
    [
      m.displayName,
      m.bio,
      category?.name.latn,
      category?.name.cyrl,
      category?.nameSingular.latn,
      category?.nameSingular.cyrl,
      city?.name.latn,
      city?.name.cyrl,
      municipality?.name.latn,
      municipality?.name.cyrl,
      ...serviceNames,
    ]
      .filter(Boolean)
      .join(" "),
  );

  haystackCache.set(m.id, value);
  return value;
}

export const majstorRepository = {
  async search(query: MajstorQuery): Promise<Paginated<Majstor>> {
    const {
      categoryId, serviceTypeIds, cityId, municipalityId, q, minRating,
      priceFromMinor, priceToMinor, verifiedOnly,
      sort = "newest", page = 1, perPage = 12,
    } = query;

    const wantedServices = serviceTypeIds?.length ? new Set(serviceTypeIds) : null;

    // Svaka reč iz upita mora da se nađe (AND), da "moler beograd" ne vrati
    // sve molere u Srbiji plus sve majstore iz Beograda.
    const terms = q ? normalizeForSearch(q).split(" ").filter(Boolean) : [];

    let items = db.majstori.filter((m) => {
      if (m.status !== "ACTIVE") return false;
      if (categoryId && !m.categoryIds.includes(categoryId)) return false;
      if (cityId && m.cityId !== cityId && !m.servesCityIds.includes(cityId)) return false;
      if (municipalityId && m.municipalityId !== municipalityId) return false;

      if (wantedServices && !m.services.some((s) => wantedServices.has(s.serviceTypeId))) {
        return false;
      }

      if (minRating && m.rating.average < minRating) return false;
      if (verifiedOnly && m.verificationLevel !== "IDENTITY") return false;

      if (priceFromMinor !== undefined || priceToMinor !== undefined) {
        const price = cheapestPrice(m);
        if (price === null) return false;
        if (priceFromMinor !== undefined && price < priceFromMinor) return false;
        if (priceToMinor !== undefined && price > priceToMinor) return false;
      }

      if (terms.length) {
        const text = haystack(m);
        if (!terms.every((term) => text.includes(term))) return false;
      }
      return true;
    });

    items = items.sort((a, b) => {
      if (sort === "rating") return b.rating.bayesianScore - a.rating.bayesianScore;
      if (sort === "priceAsc") {
        return (cheapestPrice(a) ?? Number.MAX_SAFE_INTEGER) - (cheapestPrice(b) ?? Number.MAX_SAFE_INTEGER);
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const total = items.length;
    const start = (page - 1) * perPage;

    return {
      items: items.slice(start, start + perPage),
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  },

  async findBySlug(slug: string): Promise<Majstor | null> {
    return db.majstori.find((m) => m.slug === slug) ?? null;
  },

  async findStats(majstorId: string): Promise<MajstorStats | null> {
    return db.majstorStats.find((s) => s.majstorId === majstorId) ?? null;
  },

  async listStats(majstorIds: string[]): Promise<Map<string, MajstorStats>> {
    const wanted = new Set(majstorIds);
    return new Map(
      db.majstorStats.filter((s) => wanted.has(s.majstorId)).map((s) => [s.majstorId, s]),
    );
  },

  async listSlugs(): Promise<string[]> {
    return db.majstori.filter((m) => m.status === "ACTIVE").map((m) => m.slug);
  },

  async countByCategoryAndCity(categoryId: string, cityId: string): Promise<number> {
    return db.majstori.filter(
      (m) =>
        m.status === "ACTIVE" &&
        m.categoryIds.includes(categoryId) &&
        (m.cityId === cityId || m.servesCityIds.includes(cityId)),
    ).length;
  },
};
