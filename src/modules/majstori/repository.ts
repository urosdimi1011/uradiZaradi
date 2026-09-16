import "server-only";

import type { MajstorStatus, Prisma } from "@/generated/prisma/client";
import type { PriceUnit } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
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

/**
 * Sve što treba da se sklopi domenski `Majstor`.
 *
 * Učitava se u JEDNOM upitu sa `include`, ne u petlji po majstoru. Bez toga bi
 * lista od šest kartica napravila trideset upita — klasičan N+1.
 */
const majstorInclude = {
  categories: { select: { categoryId: true } },
  servesCities: { select: { cityId: true } },
  services: { orderBy: { sortOrder: "asc" } },
  gallery: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.MajstorInclude;

type MajstorRow = Prisma.MajstorGetPayload<{ include: typeof majstorInclude }>;

function toMajstor(row: MajstorRow): Majstor {
  return {
    id: row.id,
    slug: row.slug,
    userId: row.userId,
    displayName: row.displayName,
    primaryCategoryId: row.primaryCategoryId,
    /*
     * Primarna kategorija ide PRVA. Domen to podrazumeva („prva je uvek
     * primarna"), a spojna tabela nema svoj redosled.
     */
    categoryIds: [
      row.primaryCategoryId,
      ...row.categories.map((c) => c.categoryId).filter((id) => id !== row.primaryCategoryId),
    ],
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    cityId: row.cityId,
    municipalityId: row.municipalityId,
    servesCityIds: row.servesCities.map((c) => c.cityId),
    phone: row.phone,
    yearsExperience: row.yearsExperience,
    badges: row.badges,
    verificationLevel: row.verificationLevel,
    status: row.status,
    services: row.services.map((s) => ({
      id: s.id,
      majstorId: s.majstorId,
      serviceTypeId: s.serviceTypeId,
      priceFromMinor: s.priceFromMinor,
      currency: s.currency,
      unit: s.unit,
      ...(s.note ? { note: s.note } : {}),
      sortOrder: s.sortOrder,
    })),
    gallery: row.gallery.map((p) => ({
      id: p.id,
      url: p.url,
      width: p.width,
      height: p.height,
      alt: p.alt,
      ...(p.caption ? { caption: p.caption } : {}),
      sortOrder: p.sortOrder,
    })),
    rating: {
      average: row.ratingAverage,
      count: row.ratingCount,
      distribution: {
        "1": row.ratingDist1,
        "2": row.ratingDist2,
        "3": row.ratingDist3,
        "4": row.ratingDist4,
        "5": row.ratingDist5,
      },
      bayesianScore: row.ratingBayesian,
    },
    seo: {
      title: row.seoTitle ?? undefined,
      description: row.seoDescription ?? undefined,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
  };
}

/** Prevod filtera u `WHERE`. Izdvojeno da ga dele i `search` i brojanje. */
function buildWhere(query: MajstorQuery): Prisma.MajstorWhereInput {
  const {
    categoryId,
    serviceTypeIds,
    cityId,
    municipalityId,
    q,
    minRating,
    priceFromMinor,
    priceToMinor,
    verifiedOnly,
  } = query;

  const where: Prisma.MajstorWhereInput = { status: "ACTIVE" };

  if (categoryId) where.categories = { some: { categoryId } };

  /* Majstor je relevantan i za gradove u kojima radi, ne samo za matični. */
  if (cityId) where.OR = [{ cityId }, { servesCities: { some: { cityId } } }];

  if (municipalityId) where.municipalityId = municipalityId;

  if (serviceTypeIds?.length) {
    where.services = { some: { serviceTypeId: { in: serviceTypeIds } } };
  }

  if (minRating) where.ratingAverage = { gte: minRating };
  if (verifiedOnly) where.verificationLevel = "IDENTITY";

  if (priceFromMinor !== undefined || priceToMinor !== undefined) {
    where.minPriceMinor = {
      /* `null` (sve po dogovoru) ispada iz cenovnog filtera — kao i dosad. */
      not: null,
      ...(priceFromMinor !== undefined ? { gte: priceFromMinor } : {}),
      ...(priceToMinor !== undefined ? { lte: priceToMinor } : {}),
    };
  }

  /*
   * Svaka reč iz upita mora da se nađe (AND), da „moler beograd" ne vrati sve
   * molere u Srbiji plus sve majstore iz Beograda.
   *
   * Pretražuje se `searchText` — denormalizovana kolona koju puni ISTA
   * `normalizeForSearch()` funkcija. Zato „cacak" nalazi „Čačak", a „керамичар"
   * nalazi „keramicar". Nad njom stoji GIN trigram indeks.
   */
  const terms = q ? normalizeForSearch(q).split(" ").filter(Boolean) : [];
  if (terms.length) {
    where.AND = terms.map((term) => ({ searchText: { contains: term } }));
  }

  return where;
}

function buildOrderBy(sort: MajstorQuery["sort"]): Prisma.MajstorOrderByWithRelationInput[] {
  if (sort === "rating") return [{ ratingBayesian: "desc" }];
  /*
   * `nulls: "last"` je bitno: majstori bez cene (sve po dogovoru) inače bi
   * u Postgresu ispali na VRH liste sortirane rastuće po ceni.
   */
  if (sort === "priceAsc") return [{ minPriceMinor: { sort: "asc", nulls: "last" } }];
  return [{ createdAt: "desc" }];
}

export const majstorRepository = {
  async search(query: MajstorQuery): Promise<Paginated<Majstor>> {
    const { sort = "newest", page = 1, perPage = 12 } = query;
    const where = buildWhere(query);

    /* Jedna tura ka bazi za stranicu i ukupan broj. */
    const [rows, total] = await db.$transaction([
      db.majstor.findMany({
        where,
        include: majstorInclude,
        orderBy: buildOrderBy(sort),
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      db.majstor.count({ where }),
    ]);

    return {
      items: rows.map(toMajstor),
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  },

  async count(query: MajstorQuery): Promise<number> {
    return db.majstor.count({ where: buildWhere(query) });
  },

  /** Samo objavljeni — sačuvan majstor koji je skinut ne sme da iskrsne u listi. */
  async findActiveByIds(ids: string[]): Promise<Majstor[]> {
    if (ids.length === 0) return [];

    const rows = await db.majstor.findMany({
      where: { id: { in: ids }, status: "ACTIVE" },
      include: majstorInclude,
    });
    return rows.map(toMajstor);
  },

  async findBySlug(slug: string): Promise<Majstor | null> {
    const row = await db.majstor.findUnique({ where: { slug }, include: majstorInclude });
    return row ? toMajstor(row) : null;
  },

  /**
   * Profil u izradi, sa svime što čarobnjak treba da prikaže popunjeno.
   *
   * Vraća `null` kad majstor još nije ni počeo. Ne filtrira po statusu namerno:
   * čarobnjak se koristi i za izmenu već objavljenog profila.
   */
  async findWizardProfile(userId: string) {
    return db.majstor.findUnique({
      where: { userId },
      select: {
        id: true,
        slug: true,
        status: true,
        displayName: true,
        phone: true,
        bio: true,
        avatarUrl: true,
        yearsExperience: true,
        primaryCategoryId: true,
        categories: { select: { categoryId: true } },
        cityId: true,
        municipalityId: true,
        services: { select: { serviceTypeId: true, priceFromMinor: true, unit: true } },
        gallery: { select: { id: true, url: true }, orderBy: { sortOrder: "asc" } },
      },
    });
  },

  /**
   * Korak 1 — jedini koji sme da KREIRA profil.
   *
   * Od trenutka kad ovaj red postoji, sve dalje je dopuna, pa zatvaranje
   * kartice ništa ne košta. Zato je prvi korak namerno kratak: što pre se
   * napravi red, to manje ima šta da se izgubi.
   */
  async sacuvajKorak1(
    userId: string,
    podaci: {
      displayName: string;
      phone: string;
      primaryCategoryId: string;
      /** Glavni + dodatni; listing filtrira preko ove veze. */
      sveKategorije: string[];
      cityId: string;
      municipalityId: string | null;
      slug: string;
    },
  ) {
    const { slug, sveKategorije, ...zajednicko } = podaci;

    const majstor = await db.majstor.upsert({
      where: { userId },
      create: {
        userId,
        slug,
        ...zajednicko,
        /* Bio je obavezan u šemi; popunjava se na koraku 3. */
        bio: "",
        status: "DRAFT",
      },
      /*
       * Slug se pri izmeni NE dira. Nastao je pri kreiranju i može već biti
       * indeksiran; menjanje bi razbilo adresu koju Google ima zapisanu.
       */
      update: zajednicko,
      select: { id: true, slug: true },
    });

    /*
     * Veza više-na-više se sinhronizuje: obriši ono što je odčekirano, dodaj
     * novo. Bez ove veze majstor se ne pojavljuje ni u jednom listingu —
     * `buildWhere` filtrira baš po njoj, ne po `primaryCategoryId`.
     *
     * `deleteMany` + `createMany` umesto brisanja svega: red koji ostaje ne
     * treba dirati, a `skipDuplicates` pokriva trku dva istovremena upisa.
     */
    await db.$transaction([
      db.majstorCategory.deleteMany({
        where: { majstorId: majstor.id, categoryId: { notIn: sveKategorije } },
      }),
      db.majstorCategory.createMany({
        data: sveKategorije.map((categoryId) => ({ majstorId: majstor.id, categoryId })),
        skipDuplicates: true,
      }),
    ]);

    return majstor;
  },

  /**
   * Korak 2 — usluge i cene.
   *
   * Sve u jednoj transakciji: ako bilo šta pukne, majstor ostaje sa starim
   * spiskom umesto sa pola novog. Bez transakcije bi prekinut upis ostavio
   * profil bez usluga, a takav se ne pojavljuje ni u jednom filteru.
   *
   * `minPriceMinor` se računa OVDE, jer je izvedena iz ovih istih redova.
   * Kolona postoji zato što se po ceni i filtrira i sortira, a `MIN()` nad
   * spojenom tabelom ne može da koristi indeks.
   */
  async sacuvajKorak2(
    majstorId: string,
    stavke: { serviceTypeId: string; priceFromMinor: number | null; unit: PriceUnit }[],
  ) {
    const cene = stavke.map((s) => s.priceFromMinor).filter((c): c is number => c !== null);
    /* `null` kad su sve usluge po dogovoru — sortiranje po ceni ih baca na kraj. */
    const minPriceMinor = cene.length > 0 ? Math.min(...cene) : null;

    await db.$transaction([
      db.majstorService.deleteMany({
        where: { majstorId, serviceTypeId: { notIn: stavke.map((s) => s.serviceTypeId) } },
      }),
      ...stavke.map((stavka, i) =>
        db.majstorService.upsert({
          where: {
            majstorId_serviceTypeId: { majstorId, serviceTypeId: stavka.serviceTypeId },
          },
          create: { majstorId, ...stavka, sortOrder: i },
          /*
           * `sortOrder` prati redosled na ekranu — po njemu se bira usluga koja
           * ide u naslov kartice (`headlineService`), pa nije svejedno.
           */
          update: { priceFromMinor: stavka.priceFromMinor, unit: stavka.unit, sortOrder: i },
        }),
      ),
      db.majstor.update({ where: { id: majstorId }, data: { minPriceMinor } }),
    ]);
  },

  /** Korak 3 — opis i godine iskustva. */
  async sacuvajKorak3(
    majstorId: string,
    podaci: { bio: string; yearsExperience: number | null },
  ) {
    await db.majstor.update({ where: { id: majstorId }, data: podaci });
  },

  async postaviAvatar(majstorId: string, avatarUrl: string) {
    await db.majstor.update({ where: { id: majstorId }, data: { avatarUrl } });
  },

  async brojFotografija(majstorId: string): Promise<number> {
    return db.workPhoto.count({ where: { majstorId } });
  },

  /**
   * Fotografija rada.
   *
   * Dimenzije se upisuju kao 0: pretraživač šalje već smanjenu sliku, a prave
   * dimenzije bi tražile čitanje zaglavlja slike na serveru. Kolone postoje
   * zbog `width`/`height` u HTML-u, pa ih treba popuniti kad se doda obrada.
   */
  async dodajFotografiju(majstorId: string, url: string): Promise<string> {
    const poslednja = await db.workPhoto.findFirst({
      where: { majstorId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const nova = await db.workPhoto.create({
      data: {
        majstorId,
        url,
        width: 0,
        height: 0,
        alt: "Fotografija rada",
        sortOrder: (poslednja?.sortOrder ?? -1) + 1,
      },
      select: { id: true },
    });

    return nova.id;
  },

  /** Briše fotografiju SAMO ako pripada tom majstoru; vraća adresu za brisanje fajla. */
  async obrisiFotografiju(majstorId: string, fotografijaId: string): Promise<string | null> {
    const fotografija = await db.workPhoto.findFirst({
      where: { id: fotografijaId, majstorId },
      select: { id: true, url: true },
    });
    if (!fotografija) return null;

    await db.workPhoto.delete({ where: { id: fotografija.id } });
    return fotografija.url;
  },

  /**
   * Objava profila.
   *
   * `searchText` se puni TEK OVDE, jer tek sad postoji sve od čega se sastoji —
   * ime, opis, zanat, usluge i grad. Kolona je jedini način da pretraga bude
   * neosetljiva na dijakritiku i pismo, pa profil koji je propusti postaje
   * `ACTIVE` a nevidljiv u pretrazi. To je najgora vrsta greške: ništa ne pukne.
   */
  async objavi(majstorId: string, searchText: string) {
    await db.majstor.update({
      where: { id: majstorId },
      data: { status: "ACTIVE", publishedAt: new Date(), searchText },
    });
  },

  /**
   * Osvežavanje pretrage bez menjanja statusa.
   *
   * Zove se posle SVAKE izmene objavljenog profila. Bez toga majstor koji
   * promeni ime ili doda uslugu ostaje u pretrazi pod starim podacima — i dalje
   * ga nalazi staro ime, a novo ne nalazi ništa. Ništa ne pukne, niko ne
   * prijavi, a profil tiho prestane da se poklapa sa onim što piše na njemu.
   */
  async azurirajSearchText(majstorId: string, searchText: string) {
    await db.majstor.update({ where: { id: majstorId }, data: { searchText } });
  },

  /** Sve što ulazi u `searchText`, u jednom upitu. */
  async podaciZaPretragu(majstorId: string) {
    return db.majstor.findUnique({
      where: { id: majstorId },
      select: {
        displayName: true,
        bio: true,
        primaryCategory: { select: { nameLatn: true, nameCyrl: true, nameSingularLatn: true } },
        /* Svi zanati, ne samo glavni — inače dodatni zanat nije pronalaziv. */
        categories: {
          select: { category: { select: { nameLatn: true, nameCyrl: true, nameSingularLatn: true } } },
        },
        city: { select: { nameLatn: true, nameCyrl: true } },
        municipality: { select: { nameLatn: true, nameCyrl: true } },
        services: { select: { serviceType: { select: { nameLatn: true, nameCyrl: true } } } },
      },
    });
  },

  /** Da li broj telefona već koristi neki DRUGI profil. */
  async telefonZauzet(phone: string, osimUserId: string): Promise<boolean> {
    const postojeci = await db.majstor.findUnique({
      where: { phone },
      select: { userId: true },
    });
    return Boolean(postojeci) && postojeci?.userId !== osimUserId;
  },

  /** Da li slug već postoji — za pravljenje jedinstvenog pri kreiranju. */
  async slugZauzet(slug: string): Promise<boolean> {
    return (await db.majstor.count({ where: { slug } })) > 0;
  },

  /**
   * Stanje profila prijavljenog majstora — samo status i slug, ništa više.
   *
   * Zove se pri SVAKOM prikazu stranice (traka u zaglavlju i preusmeravanje
   * posle prijave), pa namerno ne povlači `majstorInclude` sa pet spojenih
   * tabela. Dve kolone po `userId`, koji je `@unique`, znači pogodak u indeks.
   *
   * `null` znači da nalog ima ulogu MAJSTOR ali profil nije ni započet.
   */
  async findProfileStateByUserId(
    userId: string,
  ): Promise<{ status: MajstorStatus; slug: string } | null> {
    return db.majstor.findUnique({
      where: { userId },
      select: { status: true, slug: true },
    });
  },

  /** Da li profil pripada tom nalogu — za isključivanje vlasnika iz statistike. */
  async jeVlasnik(majstorId: string, userId: string): Promise<boolean> {
    const zapis = await db.majstor.findFirst({
      where: { id: majstorId, userId },
      select: { id: true },
    });
    return zapis !== null;
  },

  /**
   * +1 pregled.
   *
   * `upsert`, ne `update`: red u `MajstorStats` ne nastaje pri kreiranju
   * profila, pa novi majstor nema šta da se uveća. Bez ovoga bi prvi pregled
   * svakog novog profila pao na grešci.
   *
   * `increment` umesto čitanja pa upisa — atomično je, pa se dva pregleda u
   * istom trenutku ne pojedu međusobno.
   */
  async uvecajPregled(majstorId: string): Promise<void> {
    await db.majstorStats.upsert({
      where: { majstorId },
      create: { majstorId, profileViews: 1 },
      update: { profileViews: { increment: 1 } },
    });
  },

  async uvecajOtkrivanjeBroja(majstorId: string): Promise<void> {
    await db.majstorStats.upsert({
      where: { majstorId },
      create: { majstorId, phoneReveals: 1 },
      update: { phoneReveals: { increment: 1 } },
    });
  },

  async findStats(majstorId: string): Promise<MajstorStats | null> {
    return db.majstorStats.findUnique({ where: { majstorId } });
  },

  async listStats(majstorIds: string[]): Promise<Map<string, MajstorStats>> {
    const rows = await db.majstorStats.findMany({ where: { majstorId: { in: majstorIds } } });
    return new Map(rows.map((s) => [s.majstorId, s]));
  },

  async listSlugs(): Promise<string[]> {
    const rows = await db.majstor.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true },
    });
    return rows.map((r) => r.slug);
  },

  async countByCategoryAndCity(categoryId: string, cityId: string): Promise<number> {
    return db.majstor.count({
      where: {
        status: "ACTIVE",
        categories: { some: { categoryId } },
        OR: [{ cityId }, { servesCities: { some: { cityId } } }],
      },
    });
  },
};
