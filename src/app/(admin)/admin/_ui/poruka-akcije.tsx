"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import type { Stanje } from "@/modules/admin/actions";

type Akcija = (prethodno: Stanje | undefined, podaci: FormData) => Promise<Stanje>;

/**
 * Forma administracije sa povratnom porukom.
 *
 * Svaka admin radnja mora da kaže šta se desilo — i kad uspe i kad ne uspe.
 * Tiho odbijanje je najgori ishod: admin misli da je banovao nalog, a nije.
 */
export function AdminForma({
  akcija,
  children,
  className,
  potvrda,
}: {
  akcija: Akcija;
  children: React.ReactNode;
  className?: string;
  /** Tekst pitanja pre slanja; izostavljeno znači bez pitanja. */
  potvrda?: string;
}) {
  const [stanje, posalji, ceka] = useActionState(akcija, undefined);

  return (
    <form
      action={posalji}
      className={className}
      onSubmit={potvrda ? (e) => { if (!confirm(potvrda)) e.preventDefault(); } : undefined}
    >
      {children}

      {ceka ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-content-muted">
          <Loader2 width={13} height={13} aria-hidden className="animate-spin" />
          Radim…
        </p>
      ) : null}

      {!ceka && stanje?.ok === false ? <Poruka vrsta="greska" tekst={stanje.greska} /> : null}
      {!ceka && stanje?.ok === true && stanje.poruka ? (
        <Poruka vrsta="uspeh" tekst={stanje.poruka} />
      ) : null}
    </form>
  );
}

export function Poruka({ vrsta, tekst }: { vrsta: "greska" | "uspeh"; tekst: string }) {
  const greska = vrsta === "greska";
  const Ikona = greska ? AlertCircle : CheckCircle2;

  return (
    <p
      role={greska ? "alert" : "status"}
      className={`mt-2 flex items-start gap-1.5 text-xs ${greska ? "text-danger" : "text-success"}`}
    >
      <Ikona width={13} height={13} aria-hidden className="mt-0.5 shrink-0" />
      {tekst}
    </p>
  );
}
