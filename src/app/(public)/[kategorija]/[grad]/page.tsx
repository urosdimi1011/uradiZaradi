import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { catalogRepository } from "@/modules/catalog/repository";
import { geoRepository } from "@/modules/geo/repository";
import { majstorRepository } from "@/modules/majstori/repository";
import { countMajstoriLabel } from "@/lib/format";
import { abs, IS_DEMO } from "@/lib/site";
import { MajstoriListing } from "../../_listing/majstori-listing";

/**
 * Zanat u gradu: `/moleri/beograd`, `/keramicari/novi-sad`, …
 *
 * Ovo su stranice koje donose organski saobraćaj. Ljudi u Google kucaju
 * „moler beograd", a ne „moleri filter grad beograd" — pa URL, naslov, `h1` i
 * sadržaj moraju da govore baš to. `?grad=beograd` je za Google varijanta
 * stranice `/moleri`, ne zaseban sadržaj.
 *
 * Dva segmenta umesto `/moleri-beograd`: kod spojenog oblika se ne zna gde se
 * završava zanat a gde počinje grad („gradjevinski-radovi-novi-sad"), pa bi
 * parsiranje zavisilo od pogađanja po spisku slugova.
 */

/** Ispod ovoga stranica postoji, ali ne ulazi u sitemap niti se pregenerише. */
const MIN_MAJSTORI = 3;

export async function generateStaticParams() {
  const [categories, cities] = await Promise.all([
    catalogRepository.listCategories(),
    geoRepository.listCities(),
  ]);

  const params: { kategorija: string; grad: string }[] = [];
  for (const category of categories) {
    for (const city of cities) {
      const count = await majstorRepository.countByCategoryAndCity(category.id, city.id);
      if (count >= MIN_MAJSTORI) {
        params.push({ kategorija: category.slug, grad: city.slug });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: PageProps<"/[kategorija]/[grad]">): Promise<Metadata> {
  const { kategorija, grad } = await params;
  const [category, city] = await Promise.all([
    catalogRepository.findCategoryBySlug(kategorija),
    geoRepository.findCityBySlug(grad),
  ]);
  if (!category || !city) return {};

  const count = await majstorRepository.countByCategoryAndCity(category.id, city.id);
  const title = `${category.name.latn} u ${city.nameLocative.latn} — cene i recenzije`;

  return {
    title,
    description: `${countMajstoriLabel(count, "latn")} u ${city.nameLocative.latn} — ${category.name.latn.toLowerCase()} sa proverenim recenzijama. Uporedite cene po mernoj jedinici i pogledajte fotografije radova.`,
    alternates: { canonical: abs(`/${category.slug}/${city.slug}`) },
    /*
     * Kombinacija sa premalo majstora ostaje dostupna, ali van indeksa —
     * stranica sa jednim rezultatom je thin content i vuče ceo domen naniže.
     */
    robots:
      IS_DEMO || count < MIN_MAJSTORI ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryCityPage({
  params,
  searchParams,
}: PageProps<"/[kategorija]/[grad]">) {
  const { kategorija, grad } = await params;
  const [category, city] = await Promise.all([
    catalogRepository.findCategoryBySlug(kategorija),
    geoRepository.findCityBySlug(grad),
  ]);

  if (!category || !city) notFound();

  return (
    <MajstoriListing category={category} city={city} searchParams={await searchParams} />
  );
}
