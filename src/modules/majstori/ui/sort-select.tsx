"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Dropdown } from "@/components/ui/select";
import { makeT } from "@/lib/dictionary";
import type { Script } from "@/lib/script";

/**
 * Sortiranje — menja URL na izbor, bez dugmeta.
 *
 * Ranije je ovo bila obična forma sa `<noscript>` dugmetom: sa uključenim
 * JavaScriptom promena selekta nije radila NIŠTA, jer forma nije imala ni
 * `onChange` ni vidljivo dugme za slanje.
 *
 * `<noscript>` grana i dalje postoji radi rada bez JavaScripta — tada se
 * iscrtava nativni `select` i formu šalje dugme ispod njega.
 */
export function SortSelect({
  basePath,
  value,
  carriedFilters,
  script,
}: {
  basePath: string;
  value: string;
  /** Aktivni filteri koji moraju da prežive promenu sortiranja. */
  carriedFilters: [string, string][];
  script: Script;
}) {
  const t = makeT(script);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const push = (sort: string) => {
    const params = new URLSearchParams();
    for (const [key, v] of carriedFilters) params.append(key, v);
    /* Podrazumevano sortiranje se ne upisuje u adresu — inače ista lista ima dve adrese. */
    if (sort !== "newest") params.set("sort", sort);
    const query = params.toString();
    startTransition(() => router.push(query ? `${basePath}?${query}` : basePath));
  };

  return (
    <form
      action={basePath}
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        push(value);
      }}
    >
      {carriedFilters.map(([key, v], i) => (
        <input key={`${key}-${i}`} type="hidden" name={key} value={v} />
      ))}

      <Dropdown
        id="sort"
        name="sort"
        label={`${t("sortBy")}:`}
        raspored="u-redu"
        vrednost={value}
        onIzbor={push}
        opcije={[
          { vrednost: "newest", tekst: t("newest") },
          { vrednost: "rating", tekst: t("bestRated") },
          { vrednost: "priceAsc", tekst: t("priceAsc") },
        ]}
      />

      <noscript>
        <button type="submit" className="ml-2 text-sm text-brand underline">
          OK
        </button>
      </noscript>
    </form>
  );
}
