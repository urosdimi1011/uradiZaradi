import { Suspense } from "react";

import { CategoryStrip } from "@/modules/catalog/ui/category-strip";
import { catalogRepository } from "@/modules/catalog/repository";
import type { Category } from "@/modules/catalog/domain";
import type { City } from "@/modules/geo/domain";
import { geoRepository } from "@/modules/geo/repository";
import {
  DialogApplyButton,
  FilterDialog,
  FilterSidebar,
  FILTER_FORM_ID,
} from "@/modules/majstori/ui/filter-sidebar";
import { MajstorGridSkeleton } from "@/modules/majstori/ui/majstor-card";
import { SearchBar } from "@/modules/majstori/ui/search-bar";
import { SortSelect } from "@/modules/majstori/ui/sort-select";
import { makeT } from "@/lib/dictionary";
import { t as pick } from "@/lib/script";
import { getScript } from "@/lib/script.server";
import { countMajstori, parseFilters, type ListingSearchParams } from "./filters";
import { ResultsGrid } from "./results-grid";

/** Dva puna reda po tri kartice na desktopu — bez visećeg trećeg reda. */
const PER_PAGE = 6;

/**
 * Lista majstora — deli je početna (`/`) i stranica kategorije (`/moleri`).
 *
 * Kategorija dolazi iz PUTANJE, ne iz query stringa: `/moleri` je stranica koja
 * se indeksira i deli, `?kategorija=moleri` nije. Ostali filteri ostaju parametri
 * jer su privremeno sužavanje, a ne zaseban sadržaj.
 */
export async function MajstoriListing({
  category,
  city,
  searchParams,
}: {
  category: Category | null;
  /** Grad iz PUTANJE (`/moleri/beograd`). `null` kad putanja ne nosi grad. */
  city: City | null;
  searchParams: ListingSearchParams;
}) {
  const script = await getScript();
  const t = makeT(script);

  // Isti parser koji koristi i Server Action za živi brojač — da se brojka na
  // dugmetu i stvarni rezultat nikad ne raziđu.
  const raw = parseFilters(searchParams);

  /*
   * Grad iz putanje se ubacuje u filtere pre upita. Upit i dalje radi sa jednim
   * oblikom podataka, bez obzira da li je grad stigao iz `/moleri/beograd` ili
   * iz `?grad=beograd` — a URL i dalje ostaje čist.
   */
  const filtersWithCity = city ? { ...raw, grad: city.slug } : raw;

  /**
   * Osnova za sve linkove i akcije formi — čuva i kategoriju i grad iz putanje.
   * Filteri koji ostaju parametri (cena, ocena, usluga) kače se na ovu osnovu.
   */
  const basePath = category
    ? city
      ? `/${category.slug}/${city.slug}`
      : `/${category.slug}`
    : "/";

  const [categories, cities] = await Promise.all([
    catalogRepository.listCategories(),
    geoRepository.listCities(),
  ]);

  // Usluge postoje samo unutar kategorije — bez izabranog zanata lista je prazna.
  const services = category ? await catalogRepository.listServiceTypes(category.id) : [];

  const sort = raw.sort === "rating" || raw.sort === "priceAsc" ? raw.sort : "newest";
  const page = Math.max(1, Number(raw.strana) || 1);

  // Samo brojka — mreza rezultata se ucitava odvojeno, u <Suspense>.
  const total = await countMajstori(filtersWithCity, category?.slug ?? null);

  /** Aktivni filteri koji moraju da prežive promenu sortiranja. */
  const carriedFilters: [string, string][] = Object.entries(raw).flatMap(([key, value]) => {
    if (key === "sort" || key === "strana" || !value) return [];
    const list = Array.isArray(value) ? value : [value];
    return list.map((v) => [key, v] as [string, string]);
  });

  /** Menja se sa svakim filterom — tera Suspense da ponovo prikaze skeleton. */
  const suspenseKey = JSON.stringify([basePath, raw, page]);

  /**
   * Značka na dugmetu filtera broji SVA aktivna sužavanja, uključujući kategoriju.
   *
   * Kategorija se bira u traci, ne u panelu, ali za korisnika je to isto —
   * rezultati su suženi i to mora da se vidi. Tekst pretrage se ne broji: on je
   * vidljiv u samom polju iznad, pa bi značka ponavljala ono što se već vidi.
   */
  const activeFilterCount =
    (category ? 1 : 0) +
    raw.usluga.length +
    raw.ocena.length +
    (filtersWithCity.grad ? 1 : 0) +
    (raw.cenaOd ? 1 : 0) +
    (raw.cenaDo ? 1 : 0) +
    (raw.verifikovani ? 1 : 0);

  return (
    <div className="page-container py-5 sm:py-6">
      <SearchBar
        cities={cities}
        script={script}
        action={basePath}
        defaultQuery={raw.q}
        defaultCity={filtersWithCity.grad}
        activeFilterCount={activeFilterCount}
      />

      <div className="mt-5">
        <CategoryStrip categories={categories} activeSlug={category?.slug} script={script} />
      </div>

      {/*
        Na desktopu dve kolone; na mobilnom `display: contents` sklanja `aside`
        iz rasporeda, jer filter tamo živi u modalu preko celog ekrana i ne sme
        da zauzima mesto u toku stranice.
      */}
      <div className="mt-6 lg:grid lg:grid-cols-[270px_1fr] lg:items-stretch lg:gap-6">
        <aside className="contents lg:block">
          <FilterDialog
            title={t("filters")}
            closeLabel={t("close")}
            footer={
              <DialogApplyButton
                formId={FILTER_FORM_ID}
                categorySlug={category?.slug ?? null}
                initialTotal={total}
                label={t("showResults")}
              />
            }
          >
            <FilterSidebar
              cities={cities}
              services={services}
              activeCategory={category}
              activeCity={city}
              basePath={basePath}
              total={total}
              script={script}
              values={filtersWithCity}
            />
          </FilterDialog>
        </aside>

        <section className="flex flex-col">
          <div className="my-2 mb-5 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold text-content-primary">
              {category
                ? city
                  ? `${pick(category.name, script)} u ${pick(city.nameLocative, script)}`
                  : pick(category.name, script)
                : t("newestMajstori")}
            </h1>

            <SortSelect
              basePath={basePath}
              value={sort}
              carriedFilters={carriedFilters}
              script={script}
            />
          </div>

          {/*
            Kljuc tera Suspense da ponovo pokaze skeleton pri SVAKOJ promeni
            filtera. Bez njega React zadrzi stari sadrzaj dok se novi ucitava,
            pa se ne vidi da se nesto desilo.
          */}
          <Suspense key={suspenseKey} fallback={<MajstorGridSkeleton count={PER_PAGE} />}>
            <ResultsGrid
              filters={filtersWithCity}
              categorySlug={category?.slug ?? null}
              basePath={basePath}
              page={page}
              perPage={PER_PAGE}
              script={script}
            />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
