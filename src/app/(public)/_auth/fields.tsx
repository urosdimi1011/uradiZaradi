"use client";

import { useId, useState, type ComponentProps, type FormEvent } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { PorukePolja } from "@/modules/users/domain/auth";
import { cn } from "@/lib/cn";
import styles from "./auth.module.css";

type Zajednicko = {
  /** Poruka sa servera za ovo polje; prikazuje se ispod inputa. */
  error?: string;
  /** Poruke za mehurić pretraživača; bez njih piše „Please match the requested format". */
  poruke?: PorukePolja;
};

/**
 * Poruke pretraživača na srpskom.
 *
 * Pretraživač svoje poruke piše na jeziku sistema, ne sajta — korisnik sa
 * engleskim Windows-om dobija „Please fill out this field." na srpskom sajtu.
 * `title` atribut to ne rešava: Chrome ga kod `pattern` greške ignoriše.
 * Jedini pouzdan način je `setCustomValidity`.
 *
 * Poruka se MORA obrisati na svaki unos — dok je postavljena, polje je za
 * pretraživač trajno neispravno, pa forma ne bi mogla da se pošalje ni kad
 * korisnik sve ispravi.
 */
function nativnaPoruka(el: HTMLInputElement, poruke: PorukePolja | undefined): string {
  if (!poruke) return "";
  const v = el.validity;

  if (v.valueMissing) return poruke.required ?? "";
  if (v.tooShort) return poruke.tooShort ?? "";
  if (v.tooLong) return poruke.tooLong ?? "";
  /* `typeMismatch` je type="email"; ista greška kao naš izraz, ista poruka. */
  if (v.patternMismatch || v.typeMismatch) return poruke.pattern ?? "";
  return "";
}

function useNativneProvere(poruke: PorukePolja | undefined) {
  return {
    onInvalid: (event: FormEvent<HTMLInputElement>) => {
      const el = event.currentTarget;
      el.setCustomValidity(nativnaPoruka(el, poruke));
    },
    onInput: (event: FormEvent<HTMLInputElement>) => {
      event.currentTarget.setCustomValidity("");
    },
  };
}

/**
 * Poruka ispod polja + `aria` veza sa inputom.
 *
 * `aria-describedby` nije ukras: bez njega čitač ekrana pročita „E-pošta, polje
 * za unos" i ćuti o tome zašto je polje crveno. Sa njim pročita i grešku.
 */
function useOpisGreske(error: string | undefined) {
  const id = useId();
  return {
    opisId: error ? `${id}-greska` : undefined,
    poljeProps: error ? { "aria-invalid": true, "aria-describedby": `${id}-greska` } : {},
  };
}

/**
 * Ikonica je parametar, a ne fiksni koverat: registracija koristi isto polje za
 * ime i za e-poštu. Podrazumevano ostaje `Mail`, pa se prijava ne menja.
 */
export function TextField({
  icon: Icon = Mail,
  error,
  poruke,
  ...props
}: ComponentProps<"input"> & { icon?: LucideIcon } & Zajednicko) {
  const { opisId, poljeProps } = useOpisGreske(error);
  const nativne = useNativneProvere(poruke);

  return (
    <div>
      <div className={styles.field}>
        <Icon width={18} height={18} aria-hidden className={styles.fieldIcon} />
        <input
          {...props}
          {...poljeProps}
          {...nativne}
          className={cn(styles.fieldInput, error && styles.fieldInputInvalid)}
        />
      </div>
      {error ? (
        <p id={opisId} className={styles.fieldError}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Lozinka sa prekidačem za prikaz.
 *
 * Ikonica oka na mockupu je stvarno dugme, ne ukras — zato je ovo klijentska
 * komponenta. Prekidač ima `aria-pressed` i menja `aria-label`, da čitač ekrana
 * zna u kom je stanju; bez toga je to dugme bez značenja.
 */
export function PasswordField({
  error,
  poruke,
  ...props
}: ComponentProps<"input"> & Zajednicko) {
  const [visible, setVisible] = useState(false);
  const { opisId, poljeProps } = useOpisGreske(error);
  const nativne = useNativneProvere(poruke);

  /*
   * Lozinka se pamti OVDE, u pretraživaču — ne stiže nazad sa servera.
   *
   * React posle Server Action-a sam isprazni formu, pa bi korisnik koji je
   * pogrešio ime morao da prekuca i lozinku. Ostala polja to rešavaju
   * vrednostima iz odgovora servera, ali lozinka tim putem ne sme: završila bi
   * u HTML-u odgovora, u RSC paketu i u istoriji pretraživača.
   *
   * Kontrolisan input rešava oboje: vrednost preživi prazan hod forme, a nikad
   * ne napusti pretraživač osim kao poslata lozinka.
   */
  const [value, setValue] = useState("");

  return (
    <div>
      <div className={styles.field}>
        <Lock width={18} height={18} aria-hidden className={styles.fieldIcon} />
        <input
          {...props}
          {...poljeProps}
          {...nativne}
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          type={visible ? "text" : "password"}
          className={cn(
            styles.fieldInput,
            styles.fieldInputWithToggle,
            error && styles.fieldInputInvalid,
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? "Sakrij lozinku" : "Prikaži lozinku"}
          className={styles.fieldToggle}
        >
          {visible ? (
            <Eye width={18} height={18} aria-hidden />
          ) : (
            <EyeOff width={18} height={18} aria-hidden />
          )}
        </button>
      </div>
      {error ? (
        <p id={opisId} className={styles.fieldError}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
