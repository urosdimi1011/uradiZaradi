import { MapPin, Search } from "lucide-react";

import { Combobox } from "@/components/ui/select";
import { GetForm } from "@/components/ui/get-form";
import type { City } from "@/modules/geo/domain";
import { makeT } from "@/lib/dictionary";
import { t as pick, type Script } from "@/lib/script";
import { FilterTrigger } from "./filter-sidebar/filter-trigger";
import styles from "./search-bar.module.css";

/**
 * Traka pretrage. Raspored prati mockup: input, ikonica filtera i žuto dugme
 * dele JEDAN okvir, a izbor grada stoji odvojeno desno.
 *
 * Ostaje običan GET form bez klijentskog JS-a — rezultat je deljiv URL,
 * radi bez JavaScripta i crawler ga vidi. Sve tri posledice iste odluke.
 */
export function SearchBar({
  cities,
  script,
  defaultQuery,
  defaultCity,
  activeFilterCount = 0,
  action = "/",
}: {
  cities: City[];
  script: Script;
  defaultQuery?: string;
  defaultCity?: string;
  /** Broj aktivnih filtera — prikazuje se na dugmetu, samo na mobilnom. */
  activeFilterCount?: number;
  action?: string;
}) {
  const t = makeT(script);
  const allCountry = script === "cyrl" ? "Цела Србија" : "Cela Srbija";

  return (
    <GetForm action={action} className={styles.form} role="search">
      <div className={styles.group}>
        <input
          type="search"
          name="q"
          defaultValue={defaultQuery}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className={styles.input}
        />

        <span className={styles.divider} aria-hidden />

        {/*
          Na desktopu je panel već vidljiv u levoj koloni, pa bi ovo dugme bilo
          drugi ulaz u istu stvar. Zato postoji samo ispod 1024px, gde je jedini.
        */}
        <FilterTrigger
          label={t("filters")}
          activeCount={activeFilterCount}
          className={styles.filterButton}
        />

        {/*
          Na mobilnom se vidi samo ikona, na desktopu tekst. `aria-label` nosi
          naziv u oba slučaja — sr-only span pored vidljivog teksta bi značio
          da čitač ekrana pročita „Pretraži Pretraži".
        */}
        <button type="submit" className={styles.submit} aria-label={t("search")}>
          <Search width={16} height={16} aria-hidden className={styles.submitIcon} />
          <span className={styles.submitLabel} aria-hidden>
            {t("search")}
          </span>
        </button>
      </div>

      {/*
        Gradova je četrdeset i lista raste sa svakim novim — kroz padajuću listu
        se do „Sremske Mitrovice" stiže skrolovanjem. Zato polje sa pretragom.
        Bez JavaScript-a i na telefonu se iscrtava nativni select, pa forma
        ostaje običan GET i bez klijentskog koda.
      */}
      <Combobox
        id="pretraga-grad"
        name="grad"
        label={t("city")}
        sakrijLabel
        podrazumevana={defaultCity}
        placeholder={allCountry}
        praznoTekst={t("noCityFound")}
        posaljiNaIzbor
        ikona={<MapPin width={16} height={16} aria-hidden />}
        className={styles.city}
        inputClassName={styles.citySelect}
        opcije={[
          { vrednost: "", tekst: allCountry },
          ...cities.map((c) => ({ vrednost: c.slug, tekst: pick(c.name, script) })),
        ]}
      />
    </GetForm>
  );
}
