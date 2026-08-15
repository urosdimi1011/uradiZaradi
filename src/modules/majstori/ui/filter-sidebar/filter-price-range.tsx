import { cn } from "@/lib/cn";
import { makeT } from "@/lib/dictionary";
import type { Script } from "@/lib/script";
import styles from "./filter-sidebar.module.css";

/**
 * Raspon cene. Oznaka valute je fiksirana desno u polju, a ne u placeholderu —
 * placeholder nestane čim se počne kucati, pa korisnik usred unosa više ne zna
 * u čemu upisuje iznos.
 *
 * Valuta je RSD jer se cene tako i čuvaju; evro na mockupu je bio samo prikaz.
 */
export function FilterPriceRange({
  script,
  defaultFrom,
  defaultTo,
}: {
  script: Script;
  defaultFrom?: string;
  defaultTo?: string;
}) {
  const t = makeT(script);

  return (
    <div className={styles.group}>
      <label htmlFor="f-cena-od" className={styles.label}>
        {t("price")}
      </label>

      <div className={styles.priceRow}>
        <PriceField
          id="f-cena-od"
          name="cenaOd"
          placeholder={t("from")}
          ariaLabel={`${t("price")} — ${t("from")}`}
          defaultValue={defaultFrom}
        />
        <PriceField
          name="cenaDo"
          placeholder={t("to")}
          ariaLabel={`${t("price")} — ${t("to")}`}
          defaultValue={defaultTo}
        />
      </div>

      <p className={styles.hint}>
        {script === "cyrl"
          ? "Најнижа цена коју мајстор нуди."
          : "Najniža cena koju majstor nudi."}
      </p>
    </div>
  );
}

function PriceField({
  id,
  name,
  placeholder,
  ariaLabel,
  defaultValue,
}: {
  id?: string;
  name: string;
  placeholder: string;
  ariaLabel: string;
  defaultValue?: string;
}) {
  return (
    <div className={styles.priceField}>
      <input
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        min={0}
        placeholder={placeholder}
        aria-label={ariaLabel}
        defaultValue={defaultValue}
        className={cn(styles.control, styles.priceInput)}
      />
      <span className={styles.currency} aria-hidden>
        RSD
      </span>
    </div>
  );
}
