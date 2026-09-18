"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, Check, Clock, Loader2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormField, greskaKlasa } from "@/components/ui/form-field";
import { Select, Textarea } from "@/components/ui/field";
import { ostaviRecenzijuAction, type RecenzijaStanje } from "@/modules/reviews/actions";
import { PRAG_MODERACIJE, TEKST_NAJMANJE, TEKST_NAJVISE } from "@/modules/reviews/domain/pravila";
import { cn } from "@/lib/cn";

export type UslugaZaIzbor = { id: string; naziv: string };

/**
 * Forma za ostavljanje recenzije.
 *
 * Gostu se ne prikazuje forma nego poziv na prijavu — server već zna da nije
 * prijavljen, pa nema razloga da to sazna tek posle pisanja teksta.
 */
export function FormaRecenzije({
  slug,
  usluge,
  mozeDaOceni,
  razlog,
  pocetnaOcena = 0,
  povratak,
}: {
  slug: string;
  usluge: UslugaZaIzbor[];
  mozeDaOceni: boolean;
  /** Zašto ne može — prikazuje se umesto forme. */
  razlog?: string;
  /**
   * Ocena izabrana klikom na zvezdicu sa profila (`?ocena=4`).
   *
   * Prvi korak je tako već obavljen kad se forma otvori — ostaje samo tekst.
   * Vrednost se i dalje može promeniti ovde; ovo je polazna tačka, ne odluka.
   */
  pocetnaOcena?: number;
  /** Adresa na koju gost treba da se vrati posle prijave; podrazumevano ova stranica. */
  povratak?: string;
}) {
  const pathname = usePathname();
  const [state, formAction, pending] = useActionState<RecenzijaStanje, FormData>(
    ostaviRecenzijuAction,
    {},
  );

  const [ocena, setOcena] = useState(pocetnaOcena);
  const [tekst, setTekst] = useState("");

  if (state.uspeh) {
    return (
      <div className="flex items-start gap-3 rounded-[var(--radius-control)] border border-brand/40 bg-brand/10 p-4">
        {state.uspeh === "objavljena" ? (
          <Check width={18} height={18} aria-hidden className="mt-0.5 shrink-0 text-brand" />
        ) : (
          <Clock width={18} height={18} aria-hidden className="mt-0.5 shrink-0 text-brand" />
        )}
        <div>
          <p className="text-sm font-medium text-content-primary">
            {state.uspeh === "objavljena" ? "Hvala na recenziji!" : "Recenzija je poslata"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-content-secondary">
            {state.uspeh === "objavljena"
              ? "Vaša recenzija je odmah vidljiva na profilu."
              : "Recenzije sa nižom ocenom pregleda naš tim pre objave. Javićemo se ako nešto bude nejasno."}
          </p>
        </div>
      </div>
    );
  }

  if (!mozeDaOceni) {
    return (
      <div className="rounded-[var(--radius-control)] border border-dashed border-line px-4 py-6 text-center">
        <p className="text-sm text-content-secondary">{razlog}</p>
        {razlog?.includes("Prijavite") ? (
          <Link
            href={`/prijava?next=${encodeURIComponent(povratak ?? pathname)}`}
            className="mt-3 inline-flex h-10 items-center rounded-[var(--radius-control)] bg-brand px-5 text-sm font-semibold text-brand-foreground"
          >
            Prijava
          </Link>
        ) : null}
      </div>
    );
  }

  const preostalo = TEKST_NAJMANJE - tekst.trim().length;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="slug" value={slug} />

      {state.error ? (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-[var(--radius-control)] border border-danger/45 bg-danger/10 p-3 text-sm text-content-primary"
        >
          <AlertCircle width={16} height={16} aria-hidden className="shrink-0" />
          {state.error}
        </p>
      ) : null}

      {/*
        Zvezdice su radio dugmad, ne `<div onClick>`. Tastatura tako radi sama,
        čitač ekrana pročita „3 od 5", a forma šalje vrednost i bez JavaScripta.
      */}
      <fieldset className="border-0 p-0">
        <legend className="mb-2 text-sm font-medium text-content-primary">Vaša ocena</legend>

        <div className="flex items-center gap-1">
          {([1, 2, 3, 4, 5] as const).map((broj) => (
            <label
              key={broj}
              className="cursor-pointer p-0.5"
              title={`${broj} od 5`}
              onMouseEnter={() => undefined}
            >
              <input
                type="radio"
                name="rating"
                value={broj}
                checked={ocena === broj}
                onChange={() => setOcena(broj)}
                className="sr-only"
                aria-label={`${broj} od 5`}
              />
              <Star
                width={28}
                height={28}
                aria-hidden
                className={cn(
                  "transition-colors",
                  broj <= ocena ? "fill-brand text-brand" : "text-content-muted",
                )}
              />
            </label>
          ))}
        </div>

        {state.fieldErrors?.rating ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
            <AlertCircle width={14} height={14} aria-hidden className="shrink-0" />
            {state.fieldErrors.rating}
          </p>
        ) : null}

        {/*
          Poštena najava: čovek treba unapred da zna da niža ocena ne ide odmah
          u javnost. Bez toga izgleda kao da mu je recenzija nestala.
        */}
        {ocena > 0 && ocena <= PRAG_MODERACIJE ? (
          <p className="mt-2 text-xs leading-relaxed text-content-muted">
            Recenzije sa ocenom {PRAG_MODERACIJE} i nižom pregleda naš tim pre objave.
          </p>
        ) : null}
      </fieldset>

      {usluge.length > 0 ? (
        <FormField label="Koju uslugu je radio" error={state.fieldErrors?.serviceTypeId}>
          {(props) => (
            <Select {...props} name="serviceTypeId" defaultValue={state.values?.serviceTypeId}>
              <option value="">Ne želim da navedem</option>
              {usluge.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.naziv}
                </option>
              ))}
            </Select>
          )}
        </FormField>
      ) : null}

      <FormField
        label="Kako je posao prošao"
        hint="Napišite šta je konkretno urađeno, da li je rok ispoštovan i da li je cena bila kao dogovorena."
        error={state.fieldErrors?.body}
        required
      >
        {(props) => (
          <Textarea
            {...props}
            name="body"
            value={tekst}
            onChange={(event) => setTekst(event.currentTarget.value)}
            maxLength={TEKST_NAJVISE}
            className={greskaKlasa(state.fieldErrors?.body)}
          />
        )}
      </FormField>

      <p className="-mt-3 text-xs text-content-muted" aria-live="polite">
        {preostalo > 0 ? `Još ${preostalo} znakova.` : `${tekst.trim().length} znakova.`}
      </p>

      <Button type="submit" size="lg" disabled={pending} fullWidth className="h-12 sm:w-56">
        {pending ? (
          <Loader2 aria-hidden className="h-[1em] w-[1em] animate-spin" />
        ) : (
          "Pošalji recenziju"
        )}
      </Button>
    </form>
  );
}
