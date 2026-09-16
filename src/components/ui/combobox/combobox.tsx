"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useCombobox } from "downshift";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";
import { filtrirajOpcije, type Opcija } from "./filtriranje";
import { useNadogradnja } from "./nadogradnja";
import styles from "./combobox.module.css";

export type { Opcija };

type Props = {
  id: string;
  /** Ime polja u formi — vrednost putuje kroz skriveni input. */
  name: string;
  label: string;
  opcije: Opcija[];
  podrazumevana?: string;
  placeholder?: string;
  /** Tekst kad pretraga ne nađe ništa. */
  praznoTekst?: string;
  className?: string;
  /** Ikona levo u polju; polje tada dobija veći levi razmak. */
  ikona?: ReactNode;
  /** Ostavlja ime polja čitačima ekrana, sklanja ga sa ekrana. */
  sakrijLabel?: boolean;
  /** Za mesta sa drugačijom merom polja — traka pretrage je viša od sajdbara. */
  inputClassName?: string;
  /**
   * Izbor odmah šalje formu u kojoj polje stoji, bez klika na dugme.
   *
   * Za traku pretrage: ko izabere Beograd očekuje beogradske majstore, ne
   * nepromenjenu listu i još jedan klik. Filteri u sajdbaru se namerno ponašaju
   * drugačije — tamo se bira više stvari pa se primenjuju zajedno.
   */
  posaljiNaIzbor?: boolean;
};

/**
 * Padajuća lista sa pretragom.
 *
 * Postoji zbog jedne stvari koju nativni `select` ne može: otvorenu listu crta
 * operativni sistem i ona ne poštuje temu sajta — na Windows-u u tamnoj temi
 * ispadne bela. Sve ostalo u formama ostaje nativno.
 *
 * Tastaturu i ARIA stanja vodi `downshift`; on ne isporučuje nijedan piksel
 * stila ni jedan element DOM-a, pa izgled ostaje ovde, na našim tokenima.
 *
 * Bez JavaScript-a i na telefonu vraća se nativni `select` — vidi
 * `useNadogradnja`.
 */
export function Combobox(props: Props) {
  const nadogradjeno = useNadogradnja();
  return nadogradjeno ? <SaPretragom {...props} /> : <NativniIzbor {...props} />;
}

function SaPretragom({
  id,
  name,
  label,
  opcije,
  podrazumevana,
  placeholder,
  praznoTekst = "Nema rezultata",
  className,
  ikona,
  sakrijLabel,
  inputClassName,
  posaljiNaIzbor,
}: Props) {
  const [vrednost, postaviVrednost] = useState(podrazumevana ?? "");

  /*
   * Tekst u polju vodi downshift, mi vodimo samo listu.
   *
   * Prvo je bilo obrnuto — i polje je posle izbora pokazivalo „Niškragu": kad
   * se `inputValue` drži spolja, svaka promena MORA da se obradi, a obrađivalo
   * se samo kucanje. Naziv izabrane stavke tako nikad nije stigao u polje.
   */
  const [vidljive, postaviVidljive] = useState<Opcija[]>(opcije);

  const skriveno = useRef<HTMLInputElement>(null);
  const [zahtevSlanja, postaviZahtevSlanja] = useState(0);

  const { isOpen, getLabelProps, getMenuProps, getInputProps, getItemProps, highlightedIndex } =
    useCombobox({
      id,
      items: vidljive,
      initialSelectedItem: opcije.find((o) => o.vrednost === (podrazumevana ?? "")) ?? null,
      itemToString: (o) => o?.tekst ?? "",
      onInputValueChange: ({ inputValue, type }) => {
        /* Samo kucanje sužava listu. Upis naziva pri izboru nije pretraga. */
        if (type === useCombobox.stateChangeTypes.InputChange) {
          postaviVidljive(filtrirajOpcije(opcije, inputValue ?? ""));
        }
      },
      /*
       * Otvaranje pokazuje sve gradove. Bez ovoga bi lista nad izabranim
       * „Novi Sad" nudila samo Novi Sad — i izgledalo bi kao da se izbor ne
       * može promeniti.
       *
       * Izuzetak je kucanje: ono TAKOĐE otvara listu, pa su se oba poziva
       * dešavala u istoj izmeni stanja i ovaj je poništavao filter — lista je
       * na „no" i dalje nudila svih 41 grad.
       */
      onIsOpenChange: ({ isOpen: otvoren, type }) => {
        if (!otvoren || type === useCombobox.stateChangeTypes.InputChange) return;
        postaviVidljive(opcije);
      },
      onSelectedItemChange: ({ selectedItem }) => {
        postaviVrednost(selectedItem?.vrednost ?? "");
        if (posaljiNaIzbor) postaviZahtevSlanja((n) => n + 1);
      },
    });

  /*
   * Forma se šalje IZ EFEKTA, ne iz obrađivača izbora.
   *
   * Skriveno polje dobija novu vrednost tek pri sledećem iscrtavanju; slanje
   * odmah u obrađivaču pokupilo bi prethodni grad. Efekat se izvršava posle
   * izmene DOM-a, pa `FormData` vidi ono što je korisnik upravo izabrao.
   */
  useEffect(() => {
    if (zahtevSlanja === 0) return;
    skriveno.current?.form?.requestSubmit();
  }, [zahtevSlanja]);

  return (
    <div className={cn(styles.wrap, className)}>
      <label {...getLabelProps()} className={cn(styles.label, sakrijLabel && "sr-only")}>
        {label}
      </label>

      {/* Vrednost za formu; polje za pretragu nema `name` da upit ne ode u URL. */}
      <input ref={skriveno} type="hidden" name={name} value={vrednost} />

      <div className={styles.field}>
        {ikona ? <span className={styles.ikona}>{ikona}</span> : null}
        <input
          {...getInputProps({
            placeholder,
            /* Klik u polje označava tekst, pa kucanje odmah menja izbor. */
            onFocus: (e) => e.currentTarget.select(),
          })}
          className={cn(styles.input, ikona && styles.inputSaIkonom, inputClassName)}
        />
        <ChevronDown
          width={15}
          height={15}
          aria-hidden
          className={cn(styles.chevron, isOpen && styles.chevronOpen)}
        />
      </div>

      {/*
        `getMenuProps` mora da stoji na elementu i kad je lista zatvorena —
        downshift preko njega drži `aria-controls` vezu. Zato se skriva atributom
        i CSS-om, a ne uslovnim iscrtavanjem.
      */}
      <ul {...getMenuProps()} className={styles.panel} data-otvoren={isOpen || undefined}>
        {isOpen && vidljive.length === 0 ? <li className={styles.prazno}>{praznoTekst}</li> : null}
        {isOpen
          ? vidljive.map((o, i) => (
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
  podrazumevana,
  className,
  ikona,
  sakrijLabel,
  inputClassName,
  posaljiNaIzbor,
}: Props) {
  return (
    <div className={cn(styles.wrap, className)}>
      <label htmlFor={id} className={cn(styles.label, sakrijLabel && "sr-only")}>
        {label}
      </label>
      <div className={styles.field}>
        {ikona ? <span className={styles.ikona}>{ikona}</span> : null}
        <select
          id={id}
          name={name}
          defaultValue={podrazumevana ?? ""}
          /*
            Ovde nema odlaganja kao kod komandnog polja: nativni `select` ima
            novu vrednost već u trenutku događaja, pa `FormData` vidi tačno ono
            što je izabrano. Bez JavaScripta formu i dalje šalje dugme.
          */
          onChange={
            posaljiNaIzbor ? (e) => e.currentTarget.form?.requestSubmit() : undefined
          }
          className={cn(styles.input, styles.select, ikona && styles.inputSaIkonom, inputClassName)}
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
