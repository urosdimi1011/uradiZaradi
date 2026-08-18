import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { catalogRepository } from "@/modules/catalog/repository";
import { geoRepository } from "@/modules/geo/repository";
import { abs, IS_DEMO } from "@/lib/site";
import { MajstoriListing } from "../_listing/majstori-listing";

/**
 * Stranica kategorije: `/moleri`, `/elektricari`, …
 *
 * Kategorija je u putanji, ne u query stringu, jer je ovo zaseban sadržaj koji
 * treba da se indeksira, deli i rangira. `?kategorija=moleri` bi bio isti URL
 * kao početna sa parametrom — Google ga tretira kao varijantu jedne stranice,
 * ne kao stranicu o molerima.
 *
 * Statički segmenti (`/prijava`, `/kategorije`, `/majstor/...`) imaju prednost
 * nad ovim dinamičkim, pa ih ne presreće.
 */
export async function generateStaticParams() {
  const categories = await catalogRepository.listCategories();
  return categories.map((c) => ({ kategorija: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[kategorija]">): Promise<Metadata> {
  const { kategorija } = await params;
  const category = await catalogRepository.findCategoryBySlug(kategorija);
  if (!category) return {};

  return {
    title: category.seo.title ?? category.name.latn,
    description: category.seo.description ?? category.intro.latn.slice(0, 155),
    alternates: { canonical: abs(`/${category.slug}`) },
    robots: IS_DEMO ? { index: false, follow: false } : undefined,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/[kategorija]">) {
  const { kategorija } = await params;
  const category = await catalogRepository.findCategoryBySlug(kategorija);

  // Nepostojeći zanat mora da vrati 404, ne praznu listu — inače svaka izmišljena
  // putanja postaje indeksabilna stranica bez sadržaja.
  if (!category) notFound();

  const query = await searchParams;

  /*
   * `?grad=beograd` se preusmerava na `/moleri/beograd`.
   *
   * Bez ovoga bi isti sadržaj postojao na dve adrese: forma pretrage šalje grad
   * kao parametar, a rute ga očekuju u putanji. Preusmerenje je i fallback za
   * rad bez JavaScripta — obična GET forma i dalje završi na pravoj stranici.
   */
  const gradParam = Array.isArray(query.grad) ? query.grad[0] : query.grad;
  if (gradParam) {
    const city = await geoRepository.findCityBySlug(gradParam);
    if (city) {
      const rest = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (key === "grad" || value === undefined) continue;
        for (const v of Array.isArray(value) ? value : [value]) rest.append(key, v);
      }
      const suffix = rest.toString();
      redirect(`/${category.slug}/${city.slug}${suffix ? `?${suffix}` : ""}`);
    }
  }

  return <MajstoriListing category={category} city={null} searchParams={query} />;
}
