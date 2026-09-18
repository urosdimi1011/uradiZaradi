import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ImageOff } from "lucide-react";

import { NazadLink } from "@/components/ui/nazad-link";
import { EmptyState } from "@/components/ui/empty-state";
import { getMajstorDetail } from "@/modules/majstori/service";
import { majstorRepository } from "@/modules/majstori/repository";
import { makeT } from "@/lib/dictionary";
import { t as pick } from "@/lib/script";
import { getScript } from "@/lib/script.server";
import { toCyrillic } from "@/lib/translit";
import { abs } from "@/lib/site";

export async function generateStaticParams() {
  const slugs = await majstorRepository.listSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/majstor/[slug]/galerija">): Promise<Metadata> {
  const { slug } = await params;
  const majstor = await getMajstorDetail(slug);
  if (!majstor) return {};

  const title = `Fotografije radova — ${majstor.displayName}, ${majstor.categoryLabel.latn} ${majstor.cityLabel.latn}`;

  return {
    title,
    description: `Fotografije radova majstora ${majstor.displayName} (${majstor.categoryLabel.latn}, ${majstor.cityLabel.latn}).`,
    alternates: { canonical: abs(`/majstor/${majstor.slug}/galerija`) },
    /*
     * `noindex, follow` bez obzira na broj fotografija.
     *
     * Stranica je skoro sav sadržaj u slikama — Google tu nema šta da pročita,
     * pa bi se u indeksu takmičila sa profilom koji ima i tekst, i cene, i
     * recenzije. `follow` ostaje, pa težina i dalje teče nazad ka profilu.
     *
     * Slike i dalje mogu da se pojave u pretrazi slika: `alt` tekst i
     * `ImageObject` u JSON-LD na profilu nisu ovim ugašeni.
     */
    robots: { index: false, follow: true },
    openGraph: {
      title,
      images: majstor.gallery.slice(0, 4).map((photo) => photo.url),
    },
  };
}

/**
 * Sve fotografije radova.
 *
 * Posao koji se vidi ubedljiviji je od svakog opisa, pa ovo nije ukras nego
 * glavni argument majstora. Profil pokazuje četiri; ovde stoje sve.
 */
export default async function GalerijaPage({ params }: PageProps<"/majstor/[slug]/galerija">) {
  const { slug } = await params;
  const script = await getScript();
  const t = makeT(script);

  const majstor = await getMajstorDetail(slug);
  if (!majstor) notFound();

  const name = script === "cyrl" ? toCyrillic(majstor.displayName) : majstor.displayName;

  return (
    <div className="page-container pt-4 pb-6 lg:pt-5 lg:pb-8">
      <NazadLink href={`/majstor/${majstor.slug}`}>{name}</NazadLink>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold text-content-primary">
          {t("workPhotos")} — {name}
        </h1>
        <p className="mt-1.5 text-sm text-content-secondary">
          {pick(majstor.categoryLabel, script)} · {pick(majstor.cityLabel, script)}
          {majstor.gallery.length > 0 ? ` · ${majstor.gallery.length}` : ""}
        </p>

        {majstor.gallery.length === 0 ? (
          <EmptyState
            icon={ImageOff}
            naslov={t("noPhotos")}
            opis={t("noPhotosHint")}
            className="mt-6"
          />
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {majstor.gallery.map((photo, i) => (
              <li
                key={photo.id}
                className="relative aspect-square overflow-hidden rounded-[var(--radius-control)] bg-surface-hover"
              >
                <Image
                  src={photo.url}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
                  /*
                   * Prve četiri su iznad pregiba na većini ekrana i nose LCP;
                   * ostale se učitavaju lenjo da ne troše vezu pre nego što se
                   * do njih dođe.
                   */
                  priority={i < 4}
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
