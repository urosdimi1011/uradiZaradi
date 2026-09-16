"use client";

import { useId, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * Polje forme: naslov, sadržaj, objašnjenje i greška — uvek istim redom.
 *
 * Postoji da bi svako polje na sajtu izgledalo i ponašalo se isto, i da se
 * `aria` veze ne bi pisale iznova u svakoj formi. Bez `aria-describedby` čitač
 * ekrana pročita „Grad, izborno polje" i ćuti o tome zašto je polje crveno.
 *
 * Ne pravi sam input — prima ga kao `children`. Tako isti okvir stoji oko
 * `<input>`, `<select>`, `<textarea>` i oko grupe dugmadi, bez posebne
 * komponente za svaki oblik.
 */
export function FormField({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  /** Objašnjenje ispod polja — tiho, ali vidljivo pre nego što greška iskoči. */
  hint?: string;
  error?: string;
  required?: boolean;
  /** Prima `id` i `aria` atribute koje treba raširiti na sam input. */
  children: (props: {
    id: string;
    "aria-invalid"?: true;
    "aria-describedby"?: string;
    required?: boolean;
  }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const greskaId = `${id}-greska`;
  const objasnjenjeId = `${id}-opis`;

  /* Greška i objašnjenje zajedno — čitač ekrana treba oba, redom. */
  const opisi = [error ? greskaId : null, hint ? objasnjenjeId : null].filter(Boolean).join(" ");

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-content-primary">
        {label}
        {required ? null : (
          <span className="ml-1.5 font-normal text-content-muted">(nije obavezno)</span>
        )}
      </label>

      {children({
        id,
        required,
        ...(error ? { "aria-invalid": true as const } : {}),
        ...(opisi ? { "aria-describedby": opisi } : {}),
      })}

      {hint ? (
        <p id={objasnjenjeId} className="text-xs leading-relaxed text-content-muted">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={greskaId} className="flex items-start gap-1.5 text-xs text-danger">
          <AlertCircle width={14} height={14} aria-hidden className="mt-px shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Crveni okvir kad polje ima grešku.
 *
 * Boja NIJE jedini znak — uz nju uvek ide i poruka ispod, jer crvenu ivicu ne
 * vidi svako (oko 8% muškaraca ima neki oblik daltonizma).
 */
export function greskaKlasa(error: string | undefined): string {
  return error ? "border-danger hover:border-danger focus-visible:border-danger" : "";
}
