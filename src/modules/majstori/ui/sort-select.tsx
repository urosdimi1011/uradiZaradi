"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Select } from "@/components/ui/field";
import { makeT } from "@/lib/dictionary";
import type { Script } from "@/lib/script";

/**
 * Sortiranje — menja URL na promenu izbora, bez dugmeta.
 *
 * Ranije je ovo bila obična forma sa `<noscript>` dugmetom: sa uključenim
 * JavaScriptom promena selekta nije radila NIŠTA, jer forma nije imala ni
 * `onChange` ni vidljivo dugme za slanje.
 *
 * `<noscript>` grana i dalje postoji radi rada bez JavaScripta.
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
    if (sort !== "newest") params.set("sort", sort);
    const query = params.toString();
    startTransition(() => router.push(query ? `${basePath}?${query}` : basePath));
  };

  return (
    <form
      action={basePath}
      method="get"
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        push(value);
      }}
    >
      {carriedFilters.map(([key, v], i) => (
        <input key={`${key}-${i}`} type="hidden" name={key} value={v} />
      ))}

      <label htmlFor="sort" className="text-sm text-content-secondary">
        {t("sortBy")}:
      </label>
      <Select
        id="sort"
        name="sort"
        defaultValue={value}
        onChange={(e) => push(e.target.value)}
        className="h-9 w-44 text-sm"
      >
        <option value="newest">{t("newest")}</option>
        <option value="rating">{t("bestRated")}</option>
        <option value="priceAsc">{t("priceAsc")}</option>
      </Select>

      <noscript>
        <button type="submit" className="text-sm text-brand underline">
          OK
        </button>
      </noscript>
    </form>
  );
}
