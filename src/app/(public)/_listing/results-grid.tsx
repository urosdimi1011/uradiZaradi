import Link from "next/link";
import { savedRepository } from "@/modules/saved/repository";
import { getCurrentUser } from "@/lib/session";
import { SearchX } from "lucide-react";

import { searchMajstori } from "@/modules/majstori/service";
import { MajstorCard } from "@/modules/majstori/ui/majstor-card";
import { Pagination } from "@/modules/majstori/ui/pagination";
import { makeT } from "@/lib/dictionary";
import type { Script } from "@/lib/script";
import { toMajstorQuery, type ListingFilters } from "./filters";

/**
 * Rezultati pretrage — jedini deo stranice koji zaista čeka na podatke.
 *
 * Izdvojen u zasebnu async komponentu da bi mogao da stoji u `<Suspense>`:
 * zaglavlje, traka pretrage i filter panel se iscrtaju odmah, a ovde se u
 * međuvremenu prikaže skeleton. Bez ovog reza cela stranica bi čekala upit.
 */
export async function ResultsGrid({
  filters,
  categorySlug,
  basePath,
  page,
  perPage,
  script,
}: {
  filters: ListingFilters;
  categorySlug: string | null;
  basePath: string;
  page: number;
  perPage: number;
  script: Script;
}) {
  const t = makeT(script);

  /*
   * Faza 0 čita JSON iz memorije, pa upit traje ~1ms i skeleton nikad ne stigne
   * da se iscrta — filtriranje deluje kao da se ništa nije desilo. Kratko
   * kašnjenje čini stanje učitavanja vidljivim.
   *
   * Kad u Fazi 1 dođe baza, ovo se briše: pravi upit preko mreže sam po sebi
   * traje dovoljno. Isključuje se sa DEMO_LATENCY_MS=0.
   */
  const latency = Number(process.env.DEMO_LATENCY_MS ?? 450);
  if (latency > 0) await new Promise((resolve) => setTimeout(resolve, latency));

  const results = await searchMajstori(
    await toMajstorQuery(filters, categorySlug, page, perPage),
  );

  const buildHref = (nextPage: number) => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (key === "strana" || !value) continue;
      // `ocena` i `usluga` su višestruki, pa `append` — `set` bi zadržao samo jedan.
      if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
      else qs.set(key, value);
    }
    if (nextPage > 1) qs.set("strana", String(nextPage));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  if (results.items.length === 0) {
    return (
      /*
        Prazno stanje popunjava kolonu, ne stoji kao niska kutija na vrhu:
        kolona se rasteže na visinu filter panela, pa je ispod kratke poruke
        ostajalo pola ekrana praznine. Uz poruku ide i izlaz — nula rezultata
        je tačno trenutak kad korisniku treba način da skine filter.
      */
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-line p-10 text-center">
        <SearchX width={28} height={28} aria-hidden className="text-content-muted" />
        <p className="text-content-secondary">{t("noResults")}</p>
        <p className="text-sm text-content-muted">{t("noResultsHint")}</p>
        <Link
          href={basePath}
          className="mt-2 text-sm font-medium text-brand underline underline-offset-4"
        >
          {t("clearFilters")}
        </Link>
      </div>
    );
  }

  /*
   * Sačuvani se čitaju JEDNIM upitom za celu stranicu. Da svaka kartica pita za
   * sebe, mreža od dvanaest kartica bi napravila dvanaest upita.
   *
   * Za goste se baza ne dodiruje uopšte — `getCurrentUser()` vrati `null` i
   * ovde se staje.
   */
  const korisnik = await getCurrentUser();
  const sacuvani = korisnik
    ? await savedRepository.savedIds(korisnik.id, results.items.map((m) => m.id))
    : new Set<string>();

  return (
    <>
      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4 xl:grid-cols-3">
        {results.items.map((m, i) => (
          <li key={m.id} className="flex">
            <MajstorCard
              majstor={m}
              script={script}
              priority={i < 3}
              sacuvan={sacuvani.has(m.id)}
              prijavljen={korisnik !== null}
            />
          </li>
        ))}
      </ul>

      {/* Paginacija ostaje zakačena za dno, u ravni sa krajem filter panela. */}
      <div className="mt-auto">
        <Pagination page={results.page} totalPages={results.totalPages} buildHref={buildHref} />
      </div>
    </>
  );
}
