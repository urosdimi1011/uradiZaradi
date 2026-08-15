import Link from "next/link";
import { X } from "lucide-react";

import {
  PRICE_UNIT_LABEL,
  type Category,
  type ServiceType,
} from "@/modules/catalog/domain";
import type { City } from "@/modules/geo/domain";
import { cn } from "@/lib/cn";
import { makeT } from "@/lib/dictionary";
import { t as pick, type Script } from "@/lib/script";

import { ApplyButton } from "./apply-button";
import { FilterForm } from "./filter-form";
import { FilterPriceRange } from "./filter-price-range";
import { FilterRating } from "./filter-rating";
import { FilterSelect } from "./filter-select";
import styles from "./filter-sidebar.module.css";

/** Forma ima id da dugme „Primeni" u podnožju modala može da je pošalje spolja. */
export const FILTER_FORM_ID = "filter-forma";

export type FilterValues = {
  usluga?: string[];
  grad?: string;
  cenaOd?: string;
  cenaDo?: string;
  ocena?: string[];
  verifikovani?: string;
  q?: string;
};

export function FilterSidebar({
  cities,
  services,
  activeCategory,
  basePath,
  total,
  script,
  values,
}: {
  cities: City[];
  /** Broj rezultata za trenutni URL — polazna vrednost pre nego što se filter menja. */
  total: number;
  /** Usluge izabrane kategorije. Prazno kad kategorija nije izabrana. */
  services: ServiceType[];
  activeCategory: Category | null;
  /** `/moleri` ili `/` — forma mora da se vrati na istu putanju. */
  basePath: string;
  script: Script;
  values: FilterValues;
}) {
  const t = makeT(script);
  const allCountry = script === "cyrl" ? "Цела Србија" : "Cela Srbija";

  /** Skidanje kategorije vodi na koren, ali zadržava ostale filtere. */
  const clearCategoryHref = () => {
    const qs = new URLSearchParams();
    if (values.q) qs.set("q", values.q);
    if (values.grad) qs.set("grad", values.grad);
    if (values.cenaOd) qs.set("cenaOd", values.cenaOd);
    if (values.cenaDo) qs.set("cenaDo", values.cenaDo);
    if (values.verifikovani) qs.set("verifikovani", values.verifikovani);
    values.ocena?.forEach((o) => qs.append("ocena", o));
    const s = qs.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <FilterForm id={FILTER_FORM_ID} action={basePath} className={styles.panel}>
      {values.q ? <input type="hidden" name="q" value={values.q} /> : null}
      {/*
        Kategorija je u putanji (`action`), pa nema skrivenog polja za nju —
        „Primeni filtere" se vraća na `/moleri` i zanat se ne gubi.
      */}

      <h2 className={`${styles.title} ${styles.titleText}`}>{t("filters")}</h2>

      {/* ── Kategorija: prikaz stanja, ne drugi selektor ── */}
      <div className={styles.group}>
        <span className={styles.label}>{t("category")}</span>
        <div
          className={cn(
            styles.categoryChip,
            activeCategory && styles.categoryChipActive,
          )}
        >
          <span className={styles.categoryChipName}>
            {activeCategory
              ? pick(activeCategory.name, script)
              : t("allCategories")}
          </span>
          {activeCategory ? (
            <Link
              href={clearCategoryHref()}
              className={styles.categoryClear}
              aria-label={t("clearFilters")}
            >
              <X width={14} height={14} aria-hidden />
            </Link>
          ) : null}
        </div>
        <p className={styles.categoryHint}>
          {script === "cyrl"
            ? "Занат бирате у траци изнад резултата."
            : "Zanat birate u traci iznad rezultata."}
        </p>
      </div>

      {/*
        Usluge postoje samo unutar kategorije. Bez izabranog zanata lista bi imala
        38 stavki bez konteksta, pa se grupa jednostavno ne prikazuje.
      */}
      {services.length > 0 ? (
        <fieldset className={styles.group}>
          <legend className={styles.label}>{t("service")}</legend>
          <div className={styles.checkList}>
            {services.map((s) => (
              <label key={s.id} className={styles.serviceItem}>
                <input
                  type="checkbox"
                  name="usluga"
                  value={s.slug}
                  defaultChecked={values.usluga?.includes(s.slug)}
                  className={styles.checkbox}
                />
                <span className={styles.serviceName}>
                  {pick(s.name, script)}
                </span>
                <span className={styles.serviceUnit}>
                  {pick(PRICE_UNIT_LABEL[s.defaultUnit], script)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <FilterSelect
        id="f-grad"
        name="grad"
        label={t("location")}
        defaultValue={values.grad}
        className={styles.locationGroup}
      >
        <option value="">{allCountry}</option>
        {cities.map((c) => (
          <option key={c.id} value={c.slug}>
            {pick(c.name, script)}
          </option>
        ))}
      </FilterSelect>

      <FilterPriceRange
        script={script}
        defaultFrom={values.cenaOd}
        defaultTo={values.cenaDo}
      />

      <FilterRating script={script} selected={values.ocena ?? []} />

      <fieldset className={`${styles.group} my-3`}>
        <legend className={styles.label}>{t("verifiedMajstori")}</legend>
        <label className={`${styles.checkItem} ${styles.checkItemWide}`}>
          <input
            type="checkbox"
            name="verifikovani"
            value="1"
            defaultChecked={values.verifikovani === "1"}
            className={styles.checkbox}
          />
          <span>{t("verifiedOnly")}</span>
        </label>
      </fieldset>

      <ApplyButton
        formId={FILTER_FORM_ID}
        categorySlug={activeCategory?.slug ?? null}
        initialTotal={total}
        label={t("applyFilters")}
        className={styles.apply}
      />

      <Link href="/" className={styles.reset}>
        {t("clearFilters")}
      </Link>
    </FilterForm>
  );
}
