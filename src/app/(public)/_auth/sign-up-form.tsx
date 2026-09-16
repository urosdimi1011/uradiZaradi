"use client";

import { useActionState } from "react";
import { AlertCircle, Hammer, Loader2, Mail, Search, User } from "lucide-react";

import { signUpAction, type AuthState } from "@/modules/users/actions";
import { PATTERNS, PORUKE } from "@/modules/users/domain/auth";
import { makeT } from "@/lib/dictionary";
import type { Script } from "@/lib/script";
import { PasswordField, TextField } from "./fields";
import styles from "./auth.module.css";

/**
 * Registracija.
 *
 * Uloga se bira ovde, a ne posle: majstor i naručilac posle prijave idu na
 * različita mesta, pa je pitanje na kraju forme lošije od pitanja odmah.
 *
 * Napomena o bezbednosti: ovo polje je samo PREDLOG. Server ga ne veruje slepo
 * — `role` je u better-auth konfiguraciji `input: false`, a Zod šema svaku
 * vrednost osim `USER`/`MAJSTOR` tiho pretvara u `USER`.
 *
 * `pattern` atributi dolaze iz iste šeme koju server koristi. Pretraživač time
 * javlja grešku odmah, bez ijedne linije JavaScripta — ali to je udobnost, a ne
 * zaštita: pravu proveru radi Zod u Server Action-u.
 */
export function SignUpForm({ script }: { script: Script }) {
  const t = makeT(script);
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signUpAction, {});

  /* Izbor uloge preživljava neuspelu proveru; podrazumevano je naručilac posla. */
  const uloga = state.values?.uloga ?? "USER";

  return (
    <form action={formAction}>
      {state.error ? (
        <p className={styles.error} role="alert">
          <AlertCircle width={16} height={16} aria-hidden />
          {state.error}
        </p>
      ) : null}

      <fieldset className={styles.roleGroup}>
        <legend className={styles.roleLegend}>{t("roleQuestion")}</legend>

        <div className={styles.roleOptions}>
          <label className={styles.role}>
            <input
              type="radio"
              name="uloga"
              value="USER"
              defaultChecked={uloga !== "MAJSTOR"}
              className={styles.roleInput}
            />
            <span className={styles.roleIcon}>
              <Search width={18} height={18} aria-hidden />
            </span>
            <span>
              <span className={styles.roleTitle}>{t("roleUser")}</span>
              <span className={styles.roleHint}>{t("roleUserHint")}</span>
            </span>
          </label>

          <label className={styles.role}>
            <input
              type="radio"
              name="uloga"
              value="MAJSTOR"
              defaultChecked={uloga === "MAJSTOR"}
              className={styles.roleInput}
            />
            <span className={styles.roleIcon}>
              <Hammer width={18} height={18} aria-hidden />
            </span>
            <span>
              <span className={styles.roleTitle}>{t("roleMajstor")}</span>
              <span className={styles.roleHint}>{t("roleMajstorHint")}</span>
            </span>
          </label>
        </div>
      </fieldset>

      <div className={styles.fields}>
        <TextField
          icon={User}
          type="text"
          name="name"
          required
          minLength={2}
          maxLength={60}
          pattern={PATTERNS.name}
          poruke={PORUKE.name}
          autoComplete="name"
          defaultValue={state.values?.name}
          error={state.fieldErrors?.name}
          placeholder={t("fullName")}
          aria-label={t("fullName")}
        />
        <TextField
          icon={Mail}
          type="email"
          name="email"
          required
          maxLength={254}
          pattern={PATTERNS.email}
          poruke={PORUKE.email}
          autoComplete="email"
          defaultValue={state.values?.email}
          error={state.fieldErrors?.email}
          placeholder={t("email")}
          aria-label={t("email")}
        />
        {/*
          `new-password` govori menadžeru lozinki da ponudi generisanje nove,
          umesto da nudi postojeću sačuvanu — razlika u odnosu na prijavu.
        */}
        <PasswordField
          name="password"
          required
          minLength={8}
          maxLength={128}
          pattern={PATTERNS.password}
          poruke={PORUKE.password}
          autoComplete="new-password"
          error={state.fieldErrors?.password}
          placeholder={t("password")}
          aria-label={t("password")}
        />
      </div>

      <p className={styles.hint}>{t("passwordHint")}</p>

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? (
          <Loader2 aria-hidden className="h-[1em] w-[1em] animate-spin" />
        ) : (
          t("createAccount")
        )}
      </button>
    </form>
  );
}
