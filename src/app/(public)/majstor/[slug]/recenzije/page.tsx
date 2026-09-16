import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageSquare } from "lucide-react";

import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getMajstorDetail } from "@/modules/majstori/service";
import { majstorRepository } from "@/modules/majstori/repository";
import { ReviewsBrowser } from "@/modules/reviews/ui/reviews-browser";
import { FormaRecenzije } from "@/modules/reviews/ui/forma-recenzije";
import { reviewRepository } from "@/modules/reviews/repository";
import { PORUKE_ZABRANE, smeDaOceni } from "@/modules/reviews/domain/pravila";
import { getCurrentUser } from "@/lib/session";
import { catalogRepository } from "@/modules/catalog/repository";
import { makeT } from "@/lib/dictionary";
import { t as pick } from "@/lib/script";
import { getScript } from "@/lib/script.server";
import { toCyrillic } from "@/lib/translit";
import { abs } from "@/lib/site";

/**
 * Sve recenzije jednog majstora.
 *
 * ── Zašto bez paginacije ──
 *
 * Sve recenzije stoje na jednoj adresi. Podeljene na strane, tekst bi bio
 * razvučen po više URL-ova od kojih svaki ima premalo sadržaja da se rangira,
 * a Google bi ih međusobno takmičio. Recenzije su jedini deo profila koji
 * raste sam od sebe i piše ga neko drugi — to je najvredniji tekst koji ovaj
 * sajt ima i ne treba ga cepati.
 *
 * Ako neki majstor jednog dana dobije hiljadu recenzija, ovo se menja. Do tada
 * je paginacija rešenje za problem koji ne postoji.
 */
export async function generateStaticParams() {
  const slugs = await majstorRepository.listSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/majstor/[slug]/recenzije">): Promise<Metadata> {
  const { slug } = await params;
  const majstor = await getMajstorDetail(slug);
  if (!majstor) return {};

  const title = `Recenzije — ${majstor.displayName}, ${majstor.categoryLabel.latn} ${majstor.cityLabel.latn}`;

  return {
    title,
    description:
      majstor.rating.count > 0
        ? `${majstor.rating.count} recenzija za ${majstor.displayName}. Prosečna ocena ${majstor.rating.average.toFixed(1)} od 5.`
        : `Još nema recenzija za ${majstor.displayName}.`,
    alternates: { canonical: abs(`/majstor/${majstor.slug}/recenzije`) },
    /*
     * Indeksira se samo kad ima šta da se indeksira. Prazna stranica recenzija
     * je čist thin content — isti razlog zbog kog i profil ispod praga nosi
     * `noindex`.
     */
    robots: majstor.isIndexable && majstor.rating.count > 0 ? undefined : { index: false, follow: true },
  };
}

export default async function RecenzijePage({ params }: PageProps<"/majstor/[slug]/recenzije">) {
  const { slug } = await params;
  const script = await getScript();
  const t = makeT(script);

  const majstor = await getMajstorDetail(slug);
  if (!majstor) notFound();

  const name = script === "cyrl" ? toCyrillic(majstor.displayName) : majstor.displayName;

  /*
   * Nazivi usluga se učitavaju ovde, na serveru, i šalju kao mapa. Alternativa
   * bi bila da svaka recenzija nosi svoj naziv — isti tekst ponovljen trideset
   * puta u HTML-u.
   */
  const tipovi = await catalogRepository.listServiceTypes();
  const nazivUsluge = Object.fromEntries(tipovi.map((tip) => [tip.id, pick(tip.name, script)]));

  /*
   * Pravo na ocenjivanje se proverava OVDE, na serveru, pa se gostu i onome ko
   * je već ocenio uopšte ne prikazuje forma. Ista provera se ponavlja u akciji
   * — sakrivena forma nije zaštita.
   */
  const korisnik = await getCurrentUser();
  const majstorZapis = await majstorRepository.findBySlug(slug);

  const pravo = smeDaOceni({
    korisnikId: korisnik?.id ?? null,
    majstorUserId: majstorZapis?.userId ?? "",
    majstorStatus: majstorZapis?.status ?? "",
    vecOcenio:
      korisnik && majstorZapis
        ? await reviewRepository.vecOcenio(majstorZapis.id, korisnik.id)
        : false,
  });

  /* U izboru stoje samo usluge koje taj majstor zaista radi. */
  const njegoveUsluge = (majstorZapis?.services ?? [])
    .map((s) => ({ id: s.serviceTypeId, naziv: nazivUsluge[s.serviceTypeId] ?? "" }))
    .filter((u) => u.naziv);

  return (
    <div className="page-container py-6 lg:py-8">
      <Link
        href={`/majstor/${majstor.slug}`}
        className="inline-flex items-center gap-1 text-sm text-content-secondary transition-colors hover:text-content-primary"
      >
        <ChevronLeft width={16} height={16} aria-hidden />
        {name}
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold text-content-primary">
          {t("reviews")} — {name}
        </h1>
        <p className="mt-1.5 text-sm text-content-secondary">
          {pick(majstor.categoryLabel, script)} · {pick(majstor.cityLabel, script)}
        </p>

        <Card className="mt-5">
          <CardBody>
            <h2 className="mb-4 text-sm font-medium text-content-primary">Ostavite recenziju</h2>
            <FormaRecenzije
              slug={slug}
              usluge={njegoveUsluge}
              mozeDaOceni={pravo.sme}
              razlog={pravo.sme ? undefined : PORUKE_ZABRANE[pravo.razlog]}
            />
          </CardBody>
        </Card>

        <Card className="mt-5">
          <CardBody>
            {majstor.rating.count > 0 ? (
              <ReviewsBrowser
                reviews={majstor.reviews}
                summary={majstor.ratingSummary}
                nazivUsluge={nazivUsluge}
                script={script}
              />
            ) : (
              <EmptyState
                icon={MessageSquare}
                naslov={t("noReviews")}
                opis={t("noReviewsHint")}
              />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
