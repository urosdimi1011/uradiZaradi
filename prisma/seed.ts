/**
 * Puni bazu iz JSON seed fajlova (`src/data/*.json`).
 *
 * Pokretanje: npm run db:seed
 *
 * ID-jevi iz JSON-a se prenose doslovno („city_1", „maj_3") umesto da baza
 * generiše nove — tako veze između fajlova ostaju tačne bez mapiranja, a seed
 * je ponovljiv: isti ulaz uvek daje isti sadržaj baze.
 *
 * `src/data/*.json` i dalje generiše `scripts/generate-seed.mjs`. Taj korak
 * ostaje i posle prelaska na bazu, jer je izvor izmišljenih demo podataka.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";

import { normalizeForSearch } from "../src/lib/translit";

import { PrismaClient } from "../src/generated/prisma/client";
import type { MajstorBadge, PriceUnit } from "../src/generated/prisma/enums";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
const read = <T>(file: string): T[] => JSON.parse(readFileSync(join(DATA, file), "utf8"));

type Localized = { latn: string; cyrl: string };

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const cities = read<{
    id: string;
    slug: string;
    name: Localized;
    nameLocative: Localized;
    region: Localized;
    lat: number;
    lng: number;
    population: number;
  }>("cities.json");

  const municipalities = read<{
    id: string;
    citySlug: string;
    slug: string;
    name: Localized;
  }>("municipalities.json");

  const categories = read<{
    id: string;
    slug: string;
    name: Localized;
    nameSingular: Localized;
    icon: string;
    intro: Localized;
    seo: { title?: string; description?: string };
    sortOrder: number;
    isActive: boolean;
  }>("categories.json");

  const serviceTypes = read<{
    id: string;
    slug: string;
    categoryId: string;
    name: Localized;
    defaultUnit: PriceUnit;
    allowedUnits: PriceUnit[];
    sortOrder: number;
    isActive: boolean;
  }>("service-types.json");

  const users = read<{
    id: string;
    email: string;
    emailVerifiedAt: string | null;
    displayName: string;
    avatarUrl: string | null;
    role: "USER" | "MAJSTOR" | "ADMIN";
    status: "ACTIVE" | "SUSPENDED" | "BANNED";
    createdAt: string;
  }>("users.json");

  const majstori = read<{
    id: string;
    slug: string;
    userId: string;
    displayName: string;
    primaryCategoryId: string;
    categoryIds: string[];
    bio: string;
    avatarUrl: string | null;
    cityId: string;
    municipalityId: string | null;
    servesCityIds: string[];
    phone: string;
    yearsExperience: number | null;
    badges: MajstorBadge[];
    verificationLevel: "NONE" | "EMAIL" | "PHONE" | "IDENTITY";
    status: "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "BANNED";
    services: {
      id: string;
      serviceTypeId: string;
      priceFromMinor: number | null;
      unit: PriceUnit;
      sortOrder: number;
    }[];
    gallery: {
      id: string;
      url: string;
      width: number;
      height: number;
      alt: string;
      sortOrder: number;
    }[];
    rating: {
      average: number;
      count: number;
      distribution: Record<string, number>;
      bayesianScore: number;
    };
    seo: { title?: string; description?: string };
    createdAt: string;
    updatedAt: string;
    publishedAt: string | null;
  }>("majstori.json");

  const stats = read<{
    majstorId: string;
    profileViews: number;
    phoneReveals: number;
    messageCount: number;
  }>("majstor-stats.json");

  const reviews = read<{
    id: string;
    majstorId: string;
    authorUserId: string;
    authorDisplayName: string;
    authorAvatarUrl: string | null;
    rating: number;
    body: string;
    serviceTypeId: string | null;
    status: "PENDING" | "PUBLISHED" | "REJECTED" | "HIDDEN";
    reply: { body: string; createdAt: string } | null;
    createdAt: string;
    moderatedAt: string | null;
    moderatorId: string | null;
  }>("reviews.json");

  /*
   * Brisanje ide obrnutim redosledom od umetanja. Kaskade bi to same odradile,
   * ali eksplicitan redosled čini grešku vidljivom ako se veza kasnije promeni.
   */
  await db.savedMajstor.deleteMany();
  await db.review.deleteMany();
  await db.majstorStats.deleteMany();
  await db.workPhoto.deleteMany();
  await db.majstorService.deleteMany();
  await db.majstorCity.deleteMany();
  await db.majstorCategory.deleteMany();
  await db.promotion.deleteMany();
  await db.serviceTypeProposal.deleteMany();
  await db.majstor.deleteMany();
  await db.user.deleteMany();
  await db.serviceType.deleteMany();
  await db.category.deleteMany();
  await db.municipality.deleteMany();
  await db.city.deleteMany();

  const cityIdBySlug = new Map(cities.map((c) => [c.slug, c.id]));

  await db.city.createMany({
    data: cities.map((c) => ({
      id: c.id,
      slug: c.slug,
      nameLatn: c.name.latn,
      nameCyrl: c.name.cyrl,
      nameLocativeLatn: c.nameLocative.latn,
      nameLocativeCyrl: c.nameLocative.cyrl,
      regionLatn: c.region.latn,
      regionCyrl: c.region.cyrl,
      lat: c.lat,
      lng: c.lng,
      population: c.population,
    })),
  });

  await db.municipality.createMany({
    data: municipalities.map((m) => ({
      id: m.id,
      cityId: cityIdBySlug.get(m.citySlug)!,
      slug: m.slug,
      nameLatn: m.name.latn,
      nameCyrl: m.name.cyrl,
    })),
  });

  await db.category.createMany({
    data: categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      nameLatn: c.name.latn,
      nameCyrl: c.name.cyrl,
      nameSingularLatn: c.nameSingular.latn,
      nameSingularCyrl: c.nameSingular.cyrl,
      icon: c.icon,
      introLatn: c.intro.latn,
      introCyrl: c.intro.cyrl,
      seoTitle: c.seo.title ?? null,
      seoDescription: c.seo.description ?? null,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    })),
  });

  await db.serviceType.createMany({
    data: serviceTypes.map((s) => ({
      id: s.id,
      slug: s.slug,
      categoryId: s.categoryId,
      nameLatn: s.name.latn,
      nameCyrl: s.name.cyrl,
      defaultUnit: s.defaultUnit,
      allowedUnits: s.allowedUnits,
      sortOrder: s.sortOrder,
      isActive: s.isActive,
    })),
  });

  await db.user.createMany({
    data: users.map((u) => ({
      id: u.id,
      email: u.email,
      emailVerifiedAt: u.emailVerifiedAt ? new Date(u.emailVerifiedAt) : null,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      role: u.role,
      status: u.status,
      createdAt: new Date(u.createdAt),
    })),
  });

  /*
   * `searchText` se gradi ISTOM funkcijom koju koristi i upit. Da se gradio
   * zasebnom logikom, pretraga bi tiho prestala da nalazi ono što je upisano.
   */
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const serviceById = new Map(serviceTypes.map((s) => [s.id, s]));
  const cityById = new Map(cities.map((c) => [c.id, c]));
  const municipalityById = new Map(municipalities.map((m) => [m.id, m]));

  const buildSearchText = (m: (typeof majstori)[number]) => {
    const category = categoryById.get(m.primaryCategoryId);
    const city = cityById.get(m.cityId);
    const municipality = m.municipalityId ? municipalityById.get(m.municipalityId) : undefined;

    return normalizeForSearch(
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
        ...m.services.flatMap((s) => {
          const type = serviceById.get(s.serviceTypeId);
          return type ? [type.name.latn, type.name.cyrl] : [];
        }),
      ]
        .filter(Boolean)
        .join(" "),
    );
  };

  await db.majstor.createMany({
    data: majstori.map((m) => ({
      searchText: buildSearchText(m),
      /* Najniža cena među uslugama; `null` kad su sve po dogovoru. */
      minPriceMinor: (() => {
        const prices = m.services
          .map((s) => s.priceFromMinor)
          .filter((p): p is number => p !== null);
        return prices.length ? Math.min(...prices) : null;
      })(),
      id: m.id,
      slug: m.slug,
      userId: m.userId,
      displayName: m.displayName,
      primaryCategoryId: m.primaryCategoryId,
      bio: m.bio,
      avatarUrl: m.avatarUrl,
      cityId: m.cityId,
      municipalityId: m.municipalityId,
      phone: m.phone,
      yearsExperience: m.yearsExperience,
      badges: m.badges,
      verificationLevel: m.verificationLevel,
      status: m.status,
      seoTitle: m.seo.title ?? null,
      seoDescription: m.seo.description ?? null,
      ratingAverage: m.rating.average,
      ratingCount: m.rating.count,
      ratingBayesian: m.rating.bayesianScore,
      ratingDist1: m.rating.distribution["1"] ?? 0,
      ratingDist2: m.rating.distribution["2"] ?? 0,
      ratingDist3: m.rating.distribution["3"] ?? 0,
      ratingDist4: m.rating.distribution["4"] ?? 0,
      ratingDist5: m.rating.distribution["5"] ?? 0,
      createdAt: new Date(m.createdAt),
      updatedAt: new Date(m.updatedAt),
      publishedAt: m.publishedAt ? new Date(m.publishedAt) : null,
    })),
  });

  await db.majstorCategory.createMany({
    data: majstori.flatMap((m) =>
      m.categoryIds.map((categoryId) => ({ majstorId: m.id, categoryId })),
    ),
  });

  await db.majstorCity.createMany({
    data: majstori.flatMap((m) => m.servesCityIds.map((cityId) => ({ majstorId: m.id, cityId }))),
  });

  await db.majstorService.createMany({
    data: majstori.flatMap((m) =>
      m.services.map((s) => ({
        id: s.id,
        majstorId: m.id,
        serviceTypeId: s.serviceTypeId,
        priceFromMinor: s.priceFromMinor,
        unit: s.unit,
        sortOrder: s.sortOrder,
      })),
    ),
  });

  await db.workPhoto.createMany({
    data: majstori.flatMap((m) =>
      m.gallery.map((p) => ({
        id: p.id,
        majstorId: m.id,
        url: p.url,
        width: p.width,
        height: p.height,
        alt: p.alt,
        sortOrder: p.sortOrder,
      })),
    ),
  });

  await db.majstorStats.createMany({ data: stats });

  /*
   * Autori recenzija u JSON-u su izmišljeni („usr_rev_3") i ne postoje u
   * `users.json`. Prave se ovde, jer strani ključ na `User` mora da važi —
   * to je isto ograničenje koje sprečava recenzije bez naloga u produkciji.
   */
  const authorIds = [...new Set(reviews.map((r) => r.authorUserId))];
  const known = new Set(users.map((u) => u.id));
  const missing = authorIds.filter((id) => !known.has(id));

  if (missing.length) {
    const byAuthor = new Map(reviews.map((r) => [r.authorUserId, r]));
    await db.user.createMany({
      data: missing.map((id) => ({
        id,
        email: `${id}@primer.rs`,
        displayName: byAuthor.get(id)!.authorDisplayName,
        avatarUrl: byAuthor.get(id)!.authorAvatarUrl,
        emailVerifiedAt: new Date(),
        role: "USER" as const,
      })),
    });
  }

  /*
   * `@@unique([majstorId, authorUserId])` — jedna recenzija po korisniku po
   * majstoru. Generator demo podataka to ne garantuje, pa se duplikati ovde
   * odbacuju umesto da seed pukne.
   */
  const seen = new Set<string>();
  const uniqueReviews = reviews.filter((r) => {
    const key = `${r.majstorId}|${r.authorUserId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  await db.review.createMany({
    data: uniqueReviews.map((r) => ({
      id: r.id,
      majstorId: r.majstorId,
      authorUserId: r.authorUserId,
      authorDisplayName: r.authorDisplayName,
      authorAvatarUrl: r.authorAvatarUrl,
      rating: r.rating,
      body: r.body,
      serviceTypeId: r.serviceTypeId,
      status: r.status,
      replyBody: r.reply?.body ?? null,
      replyCreatedAt: r.reply ? new Date(r.reply.createdAt) : null,
      createdAt: new Date(r.createdAt),
      moderatedAt: r.moderatedAt ? new Date(r.moderatedAt) : null,
      moderatorId: null,
    })),
  });

  const counts = {
    gradovi: await db.city.count(),
    opstine: await db.municipality.count(),
    kategorije: await db.category.count(),
    usluge: await db.serviceType.count(),
    korisnici: await db.user.count(),
    majstori: await db.majstor.count(),
    fotografije: await db.workPhoto.count(),
    recenzije: await db.review.count(),
    odbaceneRecenzije: reviews.length - uniqueReviews.length,
  };

  for (const [key, value] of Object.entries(counts)) {
    console.log(`${key.padEnd(20)} ${String(value).padStart(4)}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
