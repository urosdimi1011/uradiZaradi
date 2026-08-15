import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { catalogRepository } from "@/modules/catalog/repository";
import { CategoryIcon } from "@/modules/catalog/ui/category-icon";
import { geoRepository } from "@/modules/geo/repository";
import { majstorRepository } from "@/modules/majstori/repository";
import { makeT } from "@/lib/dictionary";
import { getScript, t as pick } from "@/lib/script";
import { IS_DEMO } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sve kategorije majstora",
  description:
    "Pregled svih zanata na platformi — moleri, električari, vodoinstalateri, keramičari, stolari i drugi, sa uslugama i mernim jedinicama.",
  robots: IS_DEMO ? { index: false, follow: false } : undefined,
};

/**
 * Pregled svih kategorija.
 *
 * Nastala jer je „Više" u traci kategorija vodila na nepostojeću rutu. Kad
 * kategorija ostane jedini selektor zanata, ovo je jedini put do onih koje
 * ne staju u traku — dakle ne sme da bude 404.
 *
 * Uz to je i SEO čvorište: sa nje polaze linkovi ka svakoj kategoriji i ka
 * kombinacijama kategorija × grad, pa crawler iz jedne tačke dohvata sve.
 */
export default async function CategoriesPage() {
  const script = await getScript();
  const t = makeT(script);

  const [categories, cities] = await Promise.all([
    catalogRepository.listCategories(),
    geoRepository.listCities(),
  ]);

  const topCities = cities.slice(0, 4);

  const rows = await Promise.all(
    categories.map(async (category) => ({
      category,
      services: await catalogRepository.listServiceTypes(category.id),
      counts: await Promise.all(
        topCities.map(async (city) => ({
          city,
          count: await majstorRepository.countByCategoryAndCity(category.id, city.id),
        })),
      ),
    })),
  );

  return (
    <div className="page-container py-6 sm:py-8">
      <h1 className="text-2xl font-semibold text-content-primary sm:text-3xl">
        {t("allCategories")}
      </h1>
      <p className="mt-2 max-w-2xl text-content-secondary">
        {script === "cyrl"
          ? "Изаберите занат да видите мајсторе, услуге и цене по мерној јединици."
          : "Izaberite zanat da vidite majstore, usluge i cene po mernoj jedinici."}
      </p>

      <ul className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ category, services, counts }) => (
          <li
            key={category.id}
            className="rounded-[var(--radius-card)] border border-line bg-surface-card p-5 transition-colors hover:border-line-strong"
          >
            <Link href={`/${category.slug}`} className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-control)] border border-line text-brand">
                <CategoryIcon name={category.icon} size={20} />
              </span>
              <span className="text-base font-semibold text-content-primary">
                {pick(category.name, script)}
              </span>
              <ChevronRight
                width={16}
                height={16}
                aria-hidden
                className="ml-auto text-content-muted"
              />
            </Link>

            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-content-secondary">
              {pick(category.intro, script)}
            </p>

            <p className="mt-3 text-xs text-content-muted">
              {services
                .slice(0, 4)
                .map((s) => pick(s.name, script))
                .join(" · ")}
            </p>

            {/* Linkovi ka kombinacijama zanat × grad — to su stranice koje donose saobraćaj. */}
            <ul className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
              {counts
                .filter(({ count }) => count > 0)
                .map(({ city, count }) => (
                  <li key={city.id}>
                    <Link
                      href={`/${category.slug}?grad=${city.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-line px-2.5 py-1 text-xs text-content-secondary transition-colors hover:border-brand hover:text-brand"
                    >
                      {pick(city.name, script)}
                      <span className="text-content-muted">{count}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
