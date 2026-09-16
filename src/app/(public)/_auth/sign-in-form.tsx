"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { signInAction, type AuthState } from "@/modules/users/actions";
import { PORUKE } from "@/modules/users/domain/auth";
import { makeT } from "@/lib/dictionary";
import type { Script } from "@/lib/script";
import { PasswordField, TextField } from "./fields";
import styles from "./auth.module.css";

/**
 * Forma za prijavu.
 *
 * `useActionState` umesto `useState` + `fetch`: forma ostaje obična HTML forma
 * sa `action`, pa radi i pre nego što se JavaScript učita. Sa JS-om dobijamo
 * poruku o grešci i stanje učitavanja, bez ponovnog učitavanja stranice.
 *
 * Na prijavi NEMA `pattern` provere. Pravila o obliku lozinke važe tamo gde se
 * lozinka postavlja; ovde bi samo zaključala korisnike sa starijim lozinkama
 * van sopstvenog naloga kad se pravilo promeni.
 */
export function SignInForm({ script, next }: { script: Script; next?: string }) {
  const t = makeT(script);
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signInAction, {});

  return (
    <form action={formAction}>
      {/*
        Skriveno polje, ne query string pri slanju: ceo POST ide u telu zahteva,
        pa se u adresi ne pojavljuje ništa ni ovde.
      */}
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.error ? (
        <p className={styles.error} role="alert">
          <AlertCircle width={16} height={16} aria-hidden />
          {state.error}
        </p>
      ) : null}

      <div className={styles.fields}>
        <TextField
          type="email"
          name="email"
          required
          autoComplete="email"
          /*
            Bez `pattern` atributa — stari nalozi mogu imati adresu koju današnji
            izraz ne prolazi, a ne zaključavamo nikoga van sopstvenog naloga.
            `pattern` poruka ovde prevodi proveru koju `type="email"` ionako radi
            sam od sebe; ne pooštrava ništa.
          */
          poruke={{ required: PORUKE.email.required, pattern: PORUKE.email.pattern }}
          /* Vrednost sa servera posle neuspeha — bez JS-a bi forma ostala prazna. */
          defaultValue={state.values?.email}
          error={state.fieldErrors?.email}
          placeholder={t("emailOrUsername")}
          aria-label={t("emailOrUsername")}
        />
        <PasswordField
          name="password"
          required
          autoComplete="current-password"
          poruke={{ required: PORUKE.password.required }}
          error={state.fieldErrors?.password}
          placeholder={t("password")}
          aria-label={t("password")}
        />
      </div>

      <div className={styles.forgotRow}>
        <Link href="/zaboravljena-lozinka" className={styles.forgot}>
          {t("forgotPassword")}
        </Link>
      </div>

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? (
          <Loader2 aria-hidden className="h-[1em] w-[1em] animate-spin" />
        ) : (
          t("signIn")
        )}
      </button>
    </form>
  );
}
