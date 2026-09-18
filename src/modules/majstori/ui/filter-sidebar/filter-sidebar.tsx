import Link from "next/link";
import { X } from "lucide-react";

import {
  type Category,
  type ServiceType,
} from "@/modules/catalog/domain";
import type { City } from "@/modules/geo/domain";
import { cn } from "@/lib/cn";
import { makeT } from "@/lib/dictionary";
import { t as pick, type Script } from "@/lib/script";

import { ApplyButton } from "./apply-button";
import { FILTER_DIALOG_ID } from "./filter-dialog";
import { kljucFiltera } from "./kljuc";
import { Combobox } from "@/components/ui/select";
import { GetForm } from "@/components/ui/get-form";
import { FilterPriceRange } from "./filter-price-range";
import { FilterRating } from "./filter-rating";
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
  activeCity,
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
  /** Grad iz putanje. Kad postoji, prikazuje se kao stanje umesto kao selektor. */
  activeCity: City | null;
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
    /*
      `key` iz primenjenih filtera — vidi `kljuc.ts`. Bez njega „Poništi
      filtere" ostavlja kvačice na ekranu: ruta se ne menja, React zadrži iste
      `<input>` elemente, a `defaultChecked` se primenjuje samo pri montiranju.
    */
    <GetForm
      key={kljucFiltera(values, {
        kategorija: activeCategory?.slug ?? null,
        grad: activeCity?.slug ?? null,
      })}
      id={FILTER_FORM_ID}
      action={basePath}
      zatvoriDialogId={FILTER_DIALOG_ID}
      className={styles.panel}
    >
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
                {/*
                  Bez merne jedinice. Filter odgovara na pitanje „koja usluga mi
                  treba?" — jedinica na to ne odgovara, ne može se po njoj
                  filtrirati, i u desnoj koloni bez zaglavlja izgleda kao podatak
                  koji je nekud ispao. Stoji tamo gde ima smisla: uz cenu, na
                  kartici i na profilu.
                */}
                <span className={styles.serviceName}>{pick(s.name, script)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {/*
        Kad je grad u putanji (`/moleri/beograd`), prikazuje se kao stanje sa „×",
        isto kao kategorija — a NE kao selektor. Da je ostao select, forma bi ga
        slala kao `?grad=`, pa bi ista stranica postojala na dve adrese.
      */}
      {activeCity ? (
        <div className={styles.group}>
          <span className={styles.label}>{t("location")}</span>
          <div className={cn(styles.categoryChip, styles.categoryChipActive)}>
            <span className={styles.categoryChipName}>{pick(activeCity.name, script)}</span>
            <Link
              href={activeCategory ? `/${activeCategory.slug}` : "/"}
              className={styles.categoryClear}
              aria-label={t("clearFilters")}
            >
              <X width={14} height={14} aria-hidden />
            </Link>
          </div>
        </div>
      ) : (
        /*
          Gradova ima četrdeset i raste — kroz padajuću listu se do „Sremske
          Mitrovice" stiže skrolovanjem. Ovde ide polje sa pretragom; bez
          JavaScript-a i na telefonu se i dalje iscrtava nativni select.
        */
        <Combobox
          id="f-grad"
          name="grad"
          label={t("location")}
          podrazumevana={values.grad}
          placeholder={allCountry}
          praznoTekst={t("noCityFound")}
          className={styles.locationGroup}
          opcije={[
            { vrednost: "", tekst: allCountry },
            ...cities.map((c) => ({ vrednost: c.slug, tekst: pick(c.name, script) })),
          ]}
        />
      )}

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
    </GetForm>
  );
}
