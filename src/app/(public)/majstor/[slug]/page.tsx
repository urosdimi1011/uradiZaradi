import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  ImageOff,
  MapPin,
  MessageSquare,
  Siren,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Stars } from "@/components/ui/stars";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { getMajstorDetail } from "@/modules/majstori/service";
import { majstorRepository } from "@/modules/majstori/repository";
import type { MajstorBadge } from "@/modules/majstori/domain";
import { MajstorJsonLd } from "@/modules/majstori/ui/majstor-jsonld";
import { PhoneReveal } from "@/modules/majstori/ui/phone-reveal";
import { BrojacPregleda } from "@/modules/majstori/ui/brojac-pregleda";
import { vidljivostPregleda } from "@/modules/majstori/domain/statistika";
import { SaveButton } from "@/modules/saved/ui/save-button";
import { savedRepository } from "@/modules/saved/repository";
import { getCurrentUser } from "@/lib/session";
import { EmptyState } from "@/components/ui/empty-state";
import { RatingBreakdown } from "@/modules/reviews/ui/rating-breakdown";
import { ReviewItem } from "@/modules/reviews/ui/review-item";
import { approxEur, formatCount, formatPriceFrom } from "@/lib/format";
import { makeT, ui, type UiKey } from "@/lib/dictionary";
import { t as pick } from "@/lib/script";
import { getScript } from "@/lib/script.server";
import { toCyrillic } from "@/lib/translit";
import { abs } from "@/lib/site";

const VISIBLE_SERVICES = 5;
const VISIBLE_PHOTOS = 4;

const BADGE_META: Record<MajstorBadge, { icon: LucideIcon; key: UiKey }> = {
  PRO_TOOLS: { icon: Wrench, key: "badgeProTools" },
  WARRANTY: { icon: BadgeCheck, key: "badgeWarranty" },
  INVOICE: { icon: FileText, key: "badgeInvoice" },
  EMERGENCY: { icon: Siren, key: "badgeEmergency" },
};

export async function generateStaticParams() {
  const slugs = await majstorRepository.listSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/majstor/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const majstor = await getMajstorDetail(slug);
  if (!majstor) return {};

  const title = `${majstor.displayName} — ${majstor.categoryLabel.latn}, ${majstor.cityLabel.latn}`;

  return {
    title,
    description: majstor.bio.slice(0, 155),
    alternates: {
      canonical: abs(`/majstor/${majstor.slug}`),
      languages: {
        "sr-Latn-RS": abs(`/majstor/${majstor.slug}`),
        "sr-Cyrl-RS": abs(`/majstor/${majstor.slug}`),
      },
    },
    /**
     * Profil ispod praga kvaliteta se ne indeksira. Stotine šablonskih,
     * poluspremnih profila su najbrži način da marketplace ubije sopstveni domen.
     */
    robots: majstor.isIndexable ? undefined : { index: false, follow: true },
    openGraph: {
      title,
      description: majstor.bio.slice(0, 155),
      images: majstor.avatarUrl ? [majstor.avatarUrl] : undefined,
      type: "profile",
    },
  };
}

export default async function MajstorPage({ params }: PageProps<"/majstor/[slug]">) {
  const { slug } = await params;
  const script = await getScript();
  const t = makeT(script);

  const majstor = await getMajstorDetail(slug);
  if (!majstor) notFound();

  /* Za goste se baza ne dodiruje — srce je prazno i vodi na prijavu. */
  const korisnik = await getCurrentUser();
  const sacuvan = korisnik ? await savedRepository.isSaved(korisnik.id, majstor.id) : false;

  /*
   * Vlasnik gleda svoj profil — njemu se brojka prikazuje UVEK, bez praga, i
   * jasno označena kao vidljiva samo njemu.
   *
   * Bez ovoga majstor sa pet pregleda ne vidi ništa i profil mu deluje mrtvo,
   * iako se pregledi uredno broje. Sesija se ionako već čita zbog srca, pa ova
   * provera ne košta nijedan dodatni upit.
   */
  const vidljivostBroja = vidljivostPregleda({
    broj: majstor.profileViews,
    jeVlasnik: korisnik?.id === majstor.userId,
  });

  const bio = script === "cyrl" ? toCyrillic(majstor.bio) : majstor.bio;
  const name = script === "cyrl" ? toCyrillic(majstor.displayName) : majstor.displayName;
  const location = majstor.municipalityLabel
    ? `${pick(majstor.cityLabel, script)}, ${pick(majstor.municipalityLabel, script)}`
    : pick(majstor.cityLabel, script);

  const visibleServices = majstor.services.slice(0, VISIBLE_SERVICES);
  const hiddenServices = majstor.services.length - visibleServices.length;
  const visiblePhotos = majstor.gallery.slice(0, VISIBLE_PHOTOS);
  const hiddenPhotos = majstor.gallery.length - visiblePhotos.length;

  return (
    <div className="page-container py-6 lg:py-8">
      <MajstorJsonLd majstor={majstor} />

      {/* Broji pregled — vidi komentar u `statistika.ts` zašto iz pretraživača. */}
      <BrojacPregleda majstorId={majstor.id} />

      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-content-secondary transition-colors hover:text-content-primary"
      >
        <ChevronLeft width={16} height={16} aria-hidden />
        {t("backToSearch")}
      </Link>

      {/* ── Zaglavlje profila ── */}
      <div className="mt-4 grid gap-6 lg:grid-cols-[240px_1fr_300px]">
        <Avatar
          src={majstor.avatarUrl}
          name={majstor.displayName}
          priority
          sizes="(max-width: 1024px) 100vw, 480px"
          className="aspect-square w-full rounded-[var(--radius-card)] lg:aspect-4/5"
        />

        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-content-primary sm:text-3xl">{name}</h1>

          <p className="mt-1.5 flex items-center gap-1.5 text-content-secondary">
            {pick(majstor.categoryLabel, script)}
            <VerifiedBadge level={majstor.verificationLevel} size={17} />
          </p>

          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <Stars value={majstor.rating.average} size={16} />
            <span className="font-semibold text-content-primary">
              {majstor.rating.average.toFixed(1)}
            </span>
            <span className="text-content-muted">
              ({majstor.rating.count} {t("reviewsCountLabel")})
            </span>
          </p>

          <p className="mt-2.5 flex items-center gap-2 text-sm text-content-secondary">
            <MapPin width={15} height={15} className="text-content-muted" aria-hidden />
            {location}
          </p>

          {/*
            Broj poruka se NE prikazuje: poruke ne postoje, pa bi „0 poruka"
            bilo obećanje funkcije koje nema. Vraća se kad stigne ćaskanje.

            Pregledi se pojavljuju tek iznad praga — nov majstor sa nulom
            izgleda kao da niko nije bio na sajtu.
          */}
          {vidljivostBroja !== "skriveno" ? (
            <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-content-muted">
              <Eye width={14} height={14} className="shrink-0" aria-hidden />
              {formatCount(majstor.profileViews)} {t("views")}
              {vidljivostBroja === "samo-vlasnik" ? (
                <span className="text-xs">(vidite samo vi)</span>
              ) : null}
            </p>
          ) : null}

          {majstor.priceFrom ? (
            <p className="mt-4 text-lg font-semibold text-brand">
              {formatPriceFrom(majstor.priceFrom.amountMinor, majstor.priceFrom.unit, script)}
              {approxEur(majstor.priceFrom.amountMinor) ? (
                <span className="ml-2 text-sm font-normal text-content-muted">
                  {approxEur(majstor.priceFrom.amountMinor)}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>

        {/* ── Akcije ── */}
        <div className="flex flex-col gap-3">
          <PhoneReveal slug={majstor.slug} majstorId={majstor.id} script={script} />

          <SaveButton
            majstorId={majstor.id}
            sacuvan={sacuvan}
            prijavljen={korisnik !== null}
            script={script}
            varijanta="wide"
          />

          {/*
            Poruke nisu u MVP opsegu. Dugme stoji vidljivo i onemogućeno umesto da
            se izbaci — klijent na demou vidi gde funkcionalnost dolazi, a korisnik
            ne dobija obećanje koje platforma ne može da ispuni.
          */}
          <Button variant="ghost" fullWidth disabled className="justify-between border border-dashed border-line">
            <span className="inline-flex items-center gap-2">
              <MessageSquare width={16} height={16} aria-hidden />
              {t("sendMessage")}
            </span>
            <span className="rounded-[var(--radius-pill)] bg-surface-hover px-2 py-0.5 text-[11px] text-content-muted">
              {t("comingSoon")}
            </span>
          </Button>
        </div>
      </div>

      {/*
        ── Sadržaj ──
        Kolone su ćelije istog grid reda, pa im je visina već jednaka. Da bi im i
        POSLEDNJA kartica završavala na istoj liniji, ta kartica dobija `grow` i
        popunjava ostatak kolone. Bez toga kraća kolona visi iznad duže.
        `grow` a ne `flex-1`: `flex-1` postavlja `flex-basis: 0` i kartica bi
        izgubila svoju prirodnu visinu, pa bi se sadržaj stiskao.
      */}
      <div className="mt-6 grid items-stretch gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title={t("aboutMajstor")} />
            <CardBody>
              <p className="text-sm leading-relaxed text-content-secondary">{bio}</p>

              <ul className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
                {majstor.yearsExperience !== null ? (
                  <FeatureItem
                    icon={CalendarClock}
                    label={`${majstor.yearsExperience}+ ${t("yearsExperience")}`}
                  />
                ) : null}
                {majstor.badges.slice(0, 2).map((badge) => (
                  <FeatureItem
                    key={badge}
                    icon={BADGE_META[badge].icon}
                    label={pick(ui[BADGE_META[badge].key], script)}
                  />
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card className="grow">
            <CardHeader title={t("servicesAndPrices")} />
            <CardBody>
              <ul className="divide-y divide-line">
                {visibleServices.map((s) => (
                  <li key={s.id} className="flex items-baseline justify-between gap-4 py-2.5">
                    <span className="text-sm text-content-secondary">{pick(s.label, script)}</span>
                    <span className="shrink-0 text-sm font-medium text-brand">
                      {formatPriceFrom(s.price.amountMinor, s.price.unit, script)}
                    </span>
                  </li>
                ))}
              </ul>

              {hiddenServices > 0 ? (
                <Button variant="outline" fullWidth className="mt-4">
                  {t("showAllServices")} ({majstor.services.length})
                </Button>
              ) : null}
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            {/*
              Link „Prikaži sve" postoji samo kad ima šta da se prikaže. Inače
              vodi na praznu stranicu, a posetilac pomisli da se nešto nije
              učitalo.
            */}
            <CardHeader
              title={t("reviews")}
              action={
                majstor.rating.count > 0 ? (
                  <Link
                    href={`/majstor/${majstor.slug}/recenzije`}
                    className="inline-flex items-center gap-0.5 text-sm text-brand"
                  >
                    {t("showAll")}
                    <ChevronRight width={15} height={15} aria-hidden />
                  </Link>
                ) : null
              }
            />
            <CardBody>
              {majstor.rating.count > 0 ? (
                <>
                  <RatingBreakdown summary={majstor.ratingSummary} script={script} />

                  <div className="mt-5 space-y-4 border-t border-line pt-5">
                    {majstor.reviews.slice(0, 2).map((review) => (
                      <ReviewItem key={review.id} review={review} script={script} />
                    ))}
                  </div>
                </>
              ) : (
                /*
                  Bez recenzija se NE prikazuje raspodela: pet praznih traka i
                  „0.0" izgledaju kao loša ocena, a ne kao odsustvo ocene. Novom
                  majstoru bi to odbijalo posetioce zbog nečega što nije skrivio.
                */
                <EmptyState icon={MessageSquare} naslov={t("noReviews")} opis={t("noReviewsHint")} />
              )}
            </CardBody>
          </Card>

          <Card className="grow">
            <CardHeader
              title={t("workPhotos")}
              action={
                majstor.gallery.length > 0 ? (
                  <Link
                    href={`/majstor/${majstor.slug}/galerija`}
                    className="inline-flex items-center gap-0.5 text-sm text-brand"
                  >
                    {t("showAll")}
                    <ChevronRight width={15} height={15} aria-hidden />
                  </Link>
                ) : null
              }
            />
            <CardBody>
              {majstor.gallery.length === 0 ? (
                <EmptyState icon={ImageOff} naslov={t("noPhotos")} opis={t("noPhotosHint")} />
              ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {visiblePhotos.map((photo, i) => (
                  <li key={photo.id} className="relative aspect-square overflow-hidden rounded-[var(--radius-control)] bg-surface-hover">
                    <Image
                      src={photo.url}
                      alt={photo.alt}
                      fill
                      sizes="(max-width: 640px) 45vw, 160px"
                      className="object-cover"
                    />
                    {i === VISIBLE_PHOTOS - 1 && hiddenPhotos > 0 ? (
                      <span className="absolute inset-0 grid place-items-center bg-surface-base/75 text-center text-sm font-semibold text-content-primary">
                        +{hiddenPhotos}
                        <span className="block text-[11px] font-normal text-content-secondary">
                          {t("morePhotos")}
                        </span>
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-control)] border border-line text-brand">
        <Icon width={17} height={17} aria-hidden />
      </span>
      <span className="text-sm leading-tight text-content-secondary">{label}</span>
    </li>
  );
}
