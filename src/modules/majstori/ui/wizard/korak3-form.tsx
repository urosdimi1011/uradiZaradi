"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormField, greskaKlasa } from "@/components/ui/form-field";
import { Input, Textarea } from "@/components/ui/field";
import { sacuvajKorak3Action, type KorakStanje } from "@/modules/majstori/actions";
import { OPIS_NAJMANJE, OPIS_NAJVISE } from "@/modules/majstori/domain/wizard";

/**
 * Korak 3 — opis i godine iskustva.
 *
 * Slike se ovim NE šalju: avatar i fotografije radova imaju svoje akcije i
 * otpremaju se čim ih majstor izabere, dok on još piše opis. Da idu zajedno,
 * klik na „Sačuvaj" bi značio čekanje na nekoliko megabajta.
 */
export function Korak3Form({
  pocetno,
  izmena,
}: {
  pocetno: { bio: string; yearsExperience: string };
  izmena: boolean;
}) {
  const [state, formAction, pending] = useActionState<KorakStanje, FormData>(
    sacuvajKorak3Action,
    {},
  );

  const [opis, setOpis] = useState(() => state.values?.bio ?? pocetno.bio);
  const preostalo = OPIS_NAJMANJE - opis.trim().length;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error ? (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-[var(--radius-control)] border border-danger/45 bg-danger/10 p-3 text-sm text-content-primary"
        >
          <AlertCircle width={16} height={16} aria-hidden className="shrink-0" />
          {state.error}
        </p>
      ) : null}

      <FormField
        label="O vama i vašem radu"
        error={state.fieldErrors?.bio}
        hint="Napišite čime se konkretno bavite, koliko dugo i šta vas izdvaja. Detaljniji opis se bolje kotira u pretrazi."
        required
      >
        {(props) => (
          <Textarea
            {...props}
            name="bio"
            value={opis}
            onChange={(event) => setOpis(event.currentTarget.value)}
            maxLength={OPIS_NAJVISE}
            placeholder="Molerske radove radim petnaest godina, uglavnom stanove u Novom Sadu…"
            className={greskaKlasa(state.fieldErrors?.bio)}
          />
        )}
      </FormField>

      {/*
        Brojač pokazuje KOLIKO FALI, ne koliko je napisano. „Još 120 znakova" je
        uputstvo; „80/200" je zagonetka koju čovek mora sam da reši.
      */}
      <p
        className={
          preostalo > 0 ? "-mt-3 text-xs text-content-muted" : "-mt-3 text-xs text-content-secondary"
        }
        aria-live="polite"
      >
        {preostalo > 0
          ? `Još ${preostalo} ${preostalo === 1 ? "znak" : "znakova"} do najmanje dužine.`
          : `Dovoljno dugačak opis (${opis.trim().length} znakova).`}
      </p>

      <FormField label="Godine iskustva" error={state.fieldErrors?.yearsExperience}>
        {(props) => (
          <Input
            {...props}
            type="number"
            name="yearsExperience"
            defaultValue={state.values?.yearsExperience ?? pocetno.yearsExperience}
            min={0}
            max={70}
            inputMode="numeric"
            placeholder="15"
            className={`sm:w-40 ${greskaKlasa(state.fieldErrors?.yearsExperience)}`}
          />
        )}
      </FormField>

      <div className="mt-2">
        <Button type="submit" size="lg" disabled={pending} fullWidth className="h-12 sm:w-48">
          {pending ? (
            <Loader2 aria-hidden className="h-[1em] w-[1em] animate-spin" />
          ) : (
            izmena ? "Sačuvaj izmene" : "Sačuvaj i nastavi"
          )}
        </Button>
      </div>
    </form>
  );
}
