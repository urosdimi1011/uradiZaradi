"use client";

import { useSelect } from "downshift";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";
import type { Opcija } from "./filtriranje";
import { useNadogradnja } from "./nadogradnja";
import styles from "./select.module.css";

type Props = {
  id: string;
  /** Ime polja u formi; izostavljeno znači da vrednost ne putuje formom. */
  name?: string;
  label: string;
  opcije: Opcija[];
  vrednost: string;
  /** Zove se pri izboru — pozivalac odlučuje šta se dešava. */
  onIzbor: (vrednost: string) => void;
  /** `u-redu` stavlja naziv levo od kontrole, za trake iznad rezultata. */
  raspored?: "uspravno" | "u-redu";
  className?: string;
  okidacClassName?: string;
};

/**
 * Padajuća lista BEZ pretrage.
 *
 * Isti izgled i isto ponašanje liste kao `Combobox`, samo što okidač nije polje
 * za unos nego dugme — jer se ovde ne kuca. Za tri-četiri stavke pretraga nije
 * pomoć nego prazno polje koje traži da se u njega nešto unese.
 *
 * Zato `useSelect`, a ne `useCombobox`: to je ista biblioteka i isti obrazac
 * pristupačnosti (`listbox`), ali bez ijednog stanja vezanog za unos.
 *
 * Bez JavaScript-a i na telefonu vraća se nativni `select` — vidi
 * `useNadogradnja`.
 */
export function Dropdown(props: Props) {
  const nadogradjeno = useNadogradnja();
  return nadogradjeno ? <SaListom {...props} /> : <NativniIzbor {...props} />;
}

function SaListom({
  id,
  name,
  label,
  opcije,
  vrednost,
  onIzbor,
  raspored = "uspravno",
  className,
  okidacClassName,
}: Props) {
  const izabrana = opcije.find((o) => o.vrednost === vrednost) ?? null;

  const { isOpen, getLabelProps, getToggleButtonProps, getMenuProps, getItemProps, highlightedIndex } =
    useSelect({
      id,
      items: opcije,
      selectedItem: izabrana,
      itemToString: (o) => o?.tekst ?? "",
      onSelectedItemChange: ({ selectedItem }) => {
        if (selectedItem) onIzbor(selectedItem.vrednost);
      },
    });

  return (
    <div className={cn(styles.wrap, raspored === "u-redu" && styles.uRedu, className)}>
      <label {...getLabelProps()} className={styles.label}>
        {label}
      </label>

      {/* Vrednost za formu — dugme je ne šalje samo od sebe. */}
      {name ? <input type="hidden" name={name} value={vrednost} /> : null}

      <div className={styles.field}>
        <button
          type="button"
          {...getToggleButtonProps()}
          className={cn(styles.okidac, okidacClassName)}
        >
          <span className={styles.okidacTekst}>{izabrana?.tekst ?? ""}</span>
        </button>
        <ChevronDown
          width={15}
          height={15}
          aria-hidden
          className={cn(styles.chevron, isOpen && styles.chevronOpen)}
        />
      </div>

      {/*
        `getMenuProps` stoji na elementu i kad je lista zatvorena — preko njega
        downshift drži `aria-controls` vezu. Skriva se atributom i CSS-om.
      */}
      <ul {...getMenuProps()} className={styles.panel} data-otvoren={isOpen || undefined}>
        {isOpen
          ? opcije.map((o, i) => (
              <li
                key={o.vrednost}
                {...getItemProps({ item: o, index: i })}
                className={cn(
                  styles.option,
                  highlightedIndex === i && styles.optionActive,
                  o.vrednost === vrednost && styles.optionSelected,
                )}
              >
                {o.tekst}
              </li>
            ))
          : null}
      </ul>
    </div>
  );
}

/** Nativni izbor — bez JavaScript-a i na telefonu. */
function NativniIzbor({
  id,
  name,
  label,
  opcije,
  vrednost,
  onIzbor,
  raspored = "uspravno",
  className,
  okidacClassName,
}: Props) {
  return (
    <div className={cn(styles.wrap, raspored === "u-redu" && styles.uRedu, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.field}>
        <select
          id={id}
          name={name}
          value={vrednost}
          onChange={(e) => onIzbor(e.currentTarget.value)}
          className={cn(styles.input, styles.select, okidacClassName)}
        >
          {opcije.map((o) => (
            <option key={o.vrednost} value={o.vrednost}>
              {o.tekst}
            </option>
          ))}
        </select>
        <ChevronDown width={15} height={15} aria-hidden className={styles.chevron} />
      </div>
    </div>
  );
}
