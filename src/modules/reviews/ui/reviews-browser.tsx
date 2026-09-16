"use client";

import { useMemo, useState } from "react";
import { MessageSquare, Star } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/field";
import { Stars } from "@/components/ui/stars";
import type { RatingSummary } from "@/modules/majstori/domain";
import type { Review } from "@/modules/reviews/domain";
import { ReviewItem } from "./review-item";
import { cn } from "@/lib/cn";
import { makeT } from "@/lib/dictionary";
import type { Script } from "@/lib/script";

/**
 * Pregled i pretraga recenzija.
 *
 * Struktura je rađena po Checkatrade-u i Trustpilotu — dva sajta kojima su
 * recenzije glavni proizvod:
 *
 *   • sažetak i filteri stoje SA STRANE, lista zauzima ostatak širine
 *   • sažetak je zalepljen pri skrolovanju, pa se filter ne gubi iz vida kad
 *     se čita trideseta recenzija
 *   • trake raspodele SU filter — klik na „5 zvezdica" pokazuje samo te
 *     (Trustpilot); drugde je to odvojen padajući meni koji niko ne otvori
 *   • sortiranje i filter po usluzi (Checkatrade) — kupac koji traži gletovanje
 *     ne čita recenzije o farbanju stolarije
 *
 * Na telefonu se kolone slažu jedna ispod druge; tamo lepljenje nema smisla,
 * jer bi sažetak pojeo pola ekrana.
 *
 * ── Zašto se filtrira u pretraživaču ──
 *
 * Sve recenzije su ionako u HTML-u, zbog SEO-a. Kad su već tu, filtriranje na
 * serveru bi značilo odlazak po podatke koji su već stigli — sporije, a
 * stranica bi iz statičke postala dinamička i izgubila ono zbog čega je
 * pravljena. Checkatrade filtrira na serveru jer ima hiljade recenzija po
 * majstoru; kod nas ih je red veličine manje.
 *
 * Bez JavaScripta filteri ne rade, ali se CELA lista vidi — a to je i ono što
 * Google čita.
 */

const NA_POCETKU = 10;

export function ReviewsBrowser({
  reviews,
  summary,
  /** Naziv usluge po `serviceTypeId` — za oznaku i za filter. */
  nazivUsluge,
  script,
}: {
  reviews: Review[];
  summary: RatingSummary;
  nazivUsluge: Record<string, string>;
  script: Script;
}) {
  const t = makeT(script);

  const [ocena, setOcena] = useState<number | null>(null);
  const [usluga, setUsluga] = useState<string>("");
  const [redosled, setRedosled] = useState<"najnovije" | "najvise" | "najnize">("najnovije");
  const [prikazano, setPrikazano] = useState(NA_POCETKU);

  /* Ponuda u filteru su samo usluge o kojima RECENZIJE postoje — ne sve koje majstor radi. */
  const usluge = useMemo(() => {
    const ids = [...new Set(reviews.map((r) => r.serviceTypeId).filter((id) => id !== null))];
    return ids
      .map((id) => ({ id, naziv: nazivUsluge[id] ?? "" }))
      .filter((u) => u.naziv)
      .sort((a, b) => a.naziv.localeCompare(b.naziv, "sr"));
  }, [reviews, nazivUsluge]);

  const vidljive = useMemo(() => {
    const filtrirane = reviews.filter(
      (r) => (ocena === null || r.rating === ocena) && (!usluga || r.serviceTypeId === usluga),
    );

    return filtrirane.sort((a, b) => {
      if (redosled === "najvise") return b.rating - a.rating;
      if (redosled === "najnize") return a.rating - b.rating;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [reviews, ocena, usluga, redosled]);

  const filterAktivan = ocena !== null || usluga !== "";
  const max = Math.max(1, ...Object.values(summary.distribution).map((v) => v ?? 0));

  function resetuj() {
    setOcena(null);
    setUsluga("");
    setPrikazano(NA_POCETKU);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
      {/* ── Sažetak i filteri ── */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center gap-4">
          <p className="text-5xl font-semibold leading-none text-content-primary">
            {summary.average.toFixed(1)}
          </p>
          <div>
            <Stars value={summary.average} size={15} />
            <p className="mt-1.5 text-sm text-content-muted">
              {summary.count} {t("reviewsCountLabel")}
            </p>
          </div>
        </div>

        {/*
          Trake su dugmad, ne ukras. Klik na „5" ostavlja samo petice; ponovni
          klik vraća sve. Bez toga bi raspodela pokazivala da postoji jedna
          jedinica, a čitalac ne bi imao način da je nađe među trideset ocena.
        */}
        <fieldset className="mt-5 border-0 p-0">
          <legend className="sr-only">{t("filterByRating")}</legend>

          <ul className="space-y-0.5">
            {([5, 4, 3, 2, 1] as const).map((zvezdica) => {
              const broj = summary.distribution[String(zvezdica) as "1" | "2" | "3" | "4" | "5"] ?? 0;
              const izabrana = ocena === zvezdica;

              return (
                <li key={zvezdica}>
                  <button
                    type="button"
                    onClick={() => {
                      setOcena(izabrana ? null : zvezdica);
                      setPrikazano(NA_POCETKU);
                    }}
                    disabled={broj === 0}
                    aria-pressed={izabrana}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-[var(--radius-control)] px-2 py-1.5 transition-colors",
                      broj === 0
                        ? "cursor-default opacity-40"
                        : "cursor-pointer hover:bg-surface-hover",
                      izabrana && "bg-brand/10 hover:bg-brand/10",
                    )}
                  >
                    <span className="w-3 text-right text-xs text-content-secondary tabular-nums">
                      {zvezdica}
                    </span>
                    <Star width={12} height={12} className="fill-brand text-brand" aria-hidden />
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-hover">
                      <span
                        className="block h-full rounded-full bg-brand"
                        style={{ width: `${Math.round((broj / max) * 100)}%` }}
                      />
                    </span>
                    <span className="w-8 text-right text-xs text-content-muted tabular-nums">
                      {broj}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <div className="mt-5 flex flex-col gap-2.5 border-t border-line pt-5">
          {usluge.length > 1 ? (
            <Select
              value={usluga}
              onChange={(event) => {
                const izabrana = event.currentTarget.value;
                setUsluga(izabrana);
                setPrikazano(NA_POCETKU);
              }}
              aria-label={t("filterByService")}
              className="h-11 text-sm"
            >
              <option value="">{t("allServices")}</option>
              {usluge.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.naziv}
                </option>
              ))}
            </Select>
          ) : null}

          <Select
            value={redosled}
            onChange={(event) =>
              setRedosled(event.currentTarget.value as "najnovije" | "najvise" | "najnize")
            }
            aria-label={t("sortReviews")}
            className="h-11 text-sm"
          >
            <option value="najnovije">{t("sortNewest")}</option>
            <option value="najvise">{t("sortHighest")}</option>
            <option value="najnize">{t("sortLowest")}</option>
          </Select>

          {filterAktivan ? (
            <button
              type="button"
              onClick={resetuj}
              className="self-start text-sm font-medium text-brand underline-offset-4 hover:underline"
            >
              {t("clearFilters")}
            </button>
          ) : null}
        </div>
      </aside>

      {/* ── Lista ── */}
      <div>
        <p className="mb-4 text-sm text-content-muted" aria-live="polite">
          {filterAktivan
            ? `${vidljive.length} ${t("ofTotal")} ${reviews.length} ${t("reviewsCountLabel")}`
            : `${reviews.length} ${t("reviewsCountLabel")}`}
        </p>

        {vidljive.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            naslov={t("noMatchingReviews")}
            opis={t("noMatchingReviewsHint")}
          />
        ) : (
          <>
            <div className="space-y-6">
              {vidljive.slice(0, prikazano).map((review) => (
                <div key={review.id}>
                  <ReviewItem review={review} script={script} />
                  {/*
                    Usluga uz recenziju — kupac koji bira po jednoj stvari treba
                    da zna da li se pohvala odnosi baš na nju.
                  */}
                  {review.serviceTypeId && nazivUsluge[review.serviceTypeId] ? (
                    <span className="mt-2.5 inline-block rounded-[var(--radius-pill)] bg-surface-hover px-2.5 py-1 text-xs text-content-secondary">
                      {nazivUsluge[review.serviceTypeId]}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            {/*
              Ostale recenzije su VEĆ u HTML-u, samo skrivene — „Prikaži još" ih
              otkriva bez odlaska na server. Tako Google vidi sve, a čitalac ne
              dobija stranicu od deset ekrana odjednom.
            */}
            {prikazano < vidljive.length ? (
              <button
                type="button"
                onClick={() => setPrikazano((n) => n + NA_POCETKU)}
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-line-strong px-6 text-sm font-medium text-content-primary transition-colors hover:bg-surface-hover sm:w-auto"
              >
                {t("showMoreReviews")} ({Math.min(NA_POCETKU, vidljive.length - prikazano)})
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
