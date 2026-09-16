"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { sacuvajKorak2Action, type KorakStanje } from "@/modules/majstori/actions";

export type PonudjenaUsluga = {
  id: string;
  naziv: string;
  jedinice: { vrednost: string; naziv: string }[];
  podrazumevanaJedinica: string;
  /* Vrednosti već upisane — čarobnjak služi i za izmenu. */
  izabrana: boolean;
  cena: string;
  jedinica: string;
  /** Zanat kom usluga pripada; grupiše listu kad majstor ima više zanata. */
  zanat: string;
};

/**
 * Korak 2 — usluge i cene.
 *
 * Cena i jedinica se prikazuju SAMO kad je usluga čekirana. Drugačije bi ekran
 * sa deset usluga imao trideset praznih polja, a majstor ne bi znao šta se od
 * njega traži.
 *
 * Cena je neobavezna. „Po dogovoru" je za pola poslova jedini pošten odgovor, a
 * izmišljena cena je gora od nikakve — kupac je uzme kao obećanje.
 */
export function Korak2Form({ usluge, izmena }: { usluge: PonudjenaUsluga[]; izmena: boolean }) {
  const [state, formAction, pending] = useActionState<KorakStanje, FormData>(
    sacuvajKorak2Action,
    {},
  );

  const [izabrane, setIzabrane] = useState<Set<string>>(
    () => new Set(usluge.filter((usluga) => usluga.izabrana).map((usluga) => usluga.id)),
  );
  const [jedinice, setJedinice] = useState<Record<string, string>>(() =>
    Object.fromEntries(usluge.map((usluga) => [usluga.id, usluga.jedinica])),
  );

  /* Redosled zanata prati redosled usluga sa servera — glavni je prvi. */
  const grupe = [...Map.groupBy(usluge, (usluga) => usluga.zanat)];

  function prebaci(id: string, ukljuceno: boolean) {
    setIzabrane((prethodne) => {
      const nove = new Set(prethodne);
      if (ukljuceno) nove.add(id);
      else nove.delete(id);
      return nove;
    });
  }

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

      {/*
        Grupisanje po zanatu ima smisla samo kad ih ima više. Sa jednim zanatom
        bi naslov grupe bio suvišan red koji ponavlja ono što piše u naslovu
        stranice.
      */}
      {grupe.map(([zanat, uslugeZanata]) => (
        <section key={zanat}>
          {grupe.length > 1 ? (
            <h2 className="mb-2 text-sm font-medium text-content-secondary">{zanat}</h2>
          ) : null}

      <ul className="flex flex-col gap-2">
        {uslugeZanata.map((usluga) => {
          const cekirana = izabrane.has(usluga.id);
          const jedinica = jedinice[usluga.id] ?? usluga.podrazumevanaJedinica;
          /* „Po dogovoru" i cena se isključuju — cena uz tu jedinicu zbunjuje. */
          const bezCene = jedinica === "PO_DOGOVORU";
          const greskaCene = state.fieldErrors?.[`cena-${usluga.id}`];

          return (
            <li
              key={usluga.id}
              className={cn(
                "rounded-[var(--radius-control)] border p-3 transition-colors sm:p-4",
                cekirana ? "border-brand/50 bg-brand/5" : "border-line bg-surface-input",
              )}
            >
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    name="usluge"
                    value={usluga.id}
                    checked={cekirana}
                    onChange={(event) => prebaci(usluga.id, event.currentTarget.checked)}
                    className="h-4 w-4 shrink-0 accent-[var(--color-brand)]"
                  />
                  <span className="text-sm text-content-primary">{usluga.naziv}</span>
                </label>

                {cekirana ? (
                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    <Input
                      name={`cena-${usluga.id}`}
                      defaultValue={usluga.cena}
                      disabled={bezCene}
                      inputMode="decimal"
                      placeholder={bezCene ? "—" : "od"}
                      aria-label={`Cena za ${usluga.naziv}`}
                      aria-invalid={greskaCene ? true : undefined}
                      className={cn("h-10 w-24 text-sm", greskaCene && "border-danger")}
                    />
                    <Select
                      name={`jedinica-${usluga.id}`}
                      value={jedinica}
                      /* Ista zamka: vrednost se čita pre `setJedinice`, ne u njoj. */
                      onChange={(event) => {
                        const izabrana = event.currentTarget.value;
                        setJedinice((prethodne) => ({ ...prethodne, [usluga.id]: izabrana }));
                      }}
                      aria-label={`Merna jedinica za ${usluga.naziv}`}
                      className="h-10 w-full text-sm sm:w-40"
                    >
                      {usluga.jedinice.map((stavka) => (
                        <option key={stavka.vrednost} value={stavka.vrednost}>
                          {stavka.naziv}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : null}
              </div>

              {greskaCene ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
                  <AlertCircle width={14} height={14} aria-hidden className="shrink-0" />
                  {greskaCene}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
        </section>
      ))}

      <p className="text-xs leading-relaxed text-content-muted">
        Cena nije obavezna — ostavite prazno ako se dogovarate od posla do posla. Uneta cena se
        prikazuje kao „od”, pa vas ne obavezuje na tačan iznos.
      </p>

      <div className="mt-2 flex items-center gap-4">
        <Button type="submit" size="lg" disabled={pending} className="sm:w-48">
          {pending ? (
            <Loader2 aria-hidden className="h-[1em] w-[1em] animate-spin" />
          ) : (
            izmena ? "Sačuvaj izmene" : "Sačuvaj i nastavi"
          )}
        </Button>
        <span className="text-sm text-content-muted">
          Izabrano: {izabrane.size} {izabrane.size === 1 ? "usluga" : "usluga"}
        </span>
      </div>
    </form>
  );
}
