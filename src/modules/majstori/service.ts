import "server-only";
import { cache } from "react";

import { catalogRepository } from "@/modules/catalog/repository";
import type { PriceUnit } from "@/modules/catalog/domain";
import { geoRepository } from "@/modules/geo/repository";
import { reviewRepository } from "@/modules/reviews/repository";
import type { Review } from "@/modules/reviews/domain";
import type { LocalizedText } from "@/modules/shared/domain/primitives";

import {
  isMajstorIndexable,
  profileCompleteness,
  type Majstor,
  type MajstorBadge,
  type RatingSummary,
  type VerificationLevel,
} from "./domain";
import { jeNovProfil } from "./domain/statistika";
import { majstorRepository, type MajstorQuery, type Paginated } from "./repository";

/**
 * View modeli. UI komponente primaju SAMO ove tipove — nikad sirov `Majstor`.
 *
 * Razlog nije stil nego bezbednost i keširanje: telefon se ovde namerno ne prosleđuje,
 * a spajanje kategorije/grada radi server jednom, umesto svaka kartica za sebe.
 */

export type PriceTag = {
  amountMinor: number | null;
  unit: PriceUnit;
};

export type MajstorCardView = {
  id: string;
  /**
   * Vlasnik profila.
   *
   * Služi SAMO serverskom poređenju „gleda li ovo njegov vlasnik". Kartica je
   * serverska komponenta, pa ova vrednost nikad ne pređe u HTML — ako se
   * kartica ikad pretvori u klijentsku, ovo polje mora prvo da izađe odavde.
   */
  userId: string;
  slug: string;
  displayName: string;
  avatarUrl: string | null;
  categoryLabel: LocalizedText;
  verificationLevel: VerificationLevel;
  rating: { average: number; count: number };
  cityLabel: LocalizedText;
  municipalityLabel: LocalizedText | null;
  priceFrom: PriceTag | null;
  profileViews: number;
  messageCount: number;
  /** Profil postavljen skoro — kartica to kaže dok brojke još nema. */
  jeNov: boolean;
  isPromoted: boolean;
};

export type ServiceRow = {
  id: string;
  label: LocalizedText;
  price: PriceTag;
};

export type MajstorDetailView = MajstorCardView & {
  bio: string;
  yearsExperience: number | null;
  badges: MajstorBadge[];
  services: ServiceRow[];
  gallery: { id: string; url: string; alt: string; width: number; height: number }[];
  ratingSummary: RatingSummary;
  reviews: Review[];
  /** Maskiran broj — pun broj se otkriva tek posle korisničke akcije. */
  phoneMasked: string;
  isIndexable: boolean;
  completeness: number;
  updatedAt: Date;
};

/**
 * Cena u zaglavlju je cena PRVE usluge po redosledu koji je majstor sam odredio,
 * a ne najniža.
 *
 * Najniža bi bila tehnički tačna ("od X"), ali obmanjujuća: molerova priprema zidova
 * je 3 €/m², a farbanje 8 €/m². Posetilac koji na kartici vidi 3 €/m² pa na profilu
 * nađe 8 €/m² oseća se prevareno, a majstor izgleda jeftinije nego što jeste.
 * Filtriranje po ceni i dalje koristi najnižu — to je druga stvar i tamo je ispravna.
 */
function headlineService(majstor: Majstor): PriceTag | null {
  if (!majstor.services.length) return null;
  const ordered = majstor.services.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const first = ordered.find((s) => s.priceFromMinor !== null) ?? ordered[0]!;
  return { amountMinor: first.priceFromMinor, unit: first.unit };
}

/** "+381611234567" → "+381 61 ••• ••••" */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const country = digits.startsWith("381") ? `+${digits.slice(0, 3)}` : "";
  const operator = digits.slice(country ? 3 : 0, country ? 5 : 2);
  return `${country} ${operator} ••• ••••`.trim();
}

async function toCardView(majstor: Majstor, viewCount: number, messageCount: number): Promise<MajstorCardView> {
  const [category, city, municipality] = await Promise.all([
    catalogRepository.findCategoryById(majstor.primaryCategoryId),
    geoRepository.findCityById(majstor.cityId),
    majstor.municipalityId ? geoRepository.findMunicipalityById(majstor.municipalityId) : null,
  ]);

  return {
    id: majstor.id,
    userId: majstor.userId,
    slug: majstor.slug,
    displayName: majstor.displayName,
    avatarUrl: majstor.avatarUrl,
    categoryLabel: category?.nameSingular ?? { latn: "Majstor", cyrl: "Мајстор" },
    verificationLevel: majstor.verificationLevel,
    rating: { average: majstor.rating.average, count: majstor.rating.count },
    cityLabel: city?.name ?? { latn: "—", cyrl: "—" },
    municipalityLabel: municipality?.name ?? null,
    priceFrom: headlineService(majstor),
    profileViews: viewCount,
    messageCount,
    jeNov: jeNovProfil({
      createdAt: majstor.createdAt,
      brojRecenzija: majstor.rating.count,
    }),
    // Promocije nisu u MVP opsegu; polje postoji da ranking ne mora da se menja kasnije.
    isPromoted: false,
  };
}

export const searchMajstori = cache(
  async (query: MajstorQuery): Promise<Paginated<MajstorCardView>> => {
    const page = await majstorRepository.search(query);
    const stats = await majstorRepository.listStats(page.items.map((m) => m.id));

    const items = await Promise.all(
      page.items.map((m) => {
        const s = stats.get(m.id);
        return toCardView(m, s?.profileViews ?? 0, s?.messageCount ?? 0);
      }),
    );

    return { ...page, items };
  },
);

/**
 * Kartice za konkretne id-jeve — za „Sačuvano".
 *
 * Redosled koji baza vrati NIJE redosled koji je tražen, pa ga pozivalac vraća
 * sam. Ovde se zadržava samo ono što je još `ACTIVE`: majstor koji je u
 * međuvremenu skinut sa sajta ne sme da iskrsne u tuđoj listi sačuvanih.
 */
export const getMajstorCards = cache(async (ids: string[]): Promise<MajstorCardView[]> => {
  if (ids.length === 0) return [];

  const majstori = await majstorRepository.findActiveByIds(ids);
  const stats = await majstorRepository.listStats(majstori.map((m) => m.id));

  return Promise.all(
    majstori.map((m) => {
      const s = stats.get(m.id);
      return toCardView(m, s?.profileViews ?? 0, s?.messageCount ?? 0);
    }),
  );
});

export const getMajstorDetail = cache(async (slug: string): Promise<MajstorDetailView | null> => {
  const majstor = await majstorRepository.findBySlug(slug);
  if (!majstor || majstor.status !== "ACTIVE") return null;

  const [stats, reviews, serviceTypes] = await Promise.all([
    majstorRepository.findStats(majstor.id),
    reviewRepository.listPublished(majstor.id),
    catalogRepository.listServiceTypes(),
  ]);

  const card = await toCardView(majstor, stats?.profileViews ?? 0, stats?.messageCount ?? 0);
  const byId = new Map(serviceTypes.map((s) => [s.id, s]));

  return {
    ...card,
    bio: majstor.bio,
    yearsExperience: majstor.yearsExperience,
    badges: majstor.badges,
    services: majstor.services
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({
        id: s.id,
        label: byId.get(s.serviceTypeId)?.name ?? { latn: "Usluga", cyrl: "Услуга" },
        price: { amountMinor: s.priceFromMinor, unit: s.unit },
      })),
    gallery: majstor.gallery
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({ id: p.id, url: p.url, alt: p.alt, width: p.width, height: p.height })),
    ratingSummary: majstor.rating,
    reviews,
    phoneMasked: maskPhone(majstor.phone),
    isIndexable: isMajstorIndexable(majstor),
    completeness: profileCompleteness(majstor),
    updatedAt: majstor.updatedAt,
  };
});

/**
 * Puni broj telefona — namerno odvojena funkcija, da nikad ne procuri kroz
 * listing ili kroz JSON payload profila. U Fazi 1 iza nje stoji Server Action
 * koja loguje otkrivanje broja (to je i lead signal i osnova za naplatu).
 */
export async function revealPhone(slug: string): Promise<string | null> {
  const majstor = await majstorRepository.findBySlug(slug);
  return majstor?.status === "ACTIVE" ? majstor.phone : null;
}
