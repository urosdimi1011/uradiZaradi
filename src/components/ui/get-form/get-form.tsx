"use client";

import { useRouter } from "next/navigation";
import { useTransition, type FormEvent, type ReactNode } from "react";

import { adresaIzForme } from "./upit";

/**
 * GET forma sa klijentskom navigacijom.
 *
 * `action` i `method="get"` ostaju na elementu namerno: bez JavaScripta forma
 * radi kao obična GET forma. Sa JavaScriptom se slanje presreće i radi se
 * `router.push`, pa server vraća samo izmenjeni segment umesto celog dokumenta —
 * to je AJAX, ali bez ručnog `fetch`-a i bez gubljenja URL-a.
 *
 * URL se i dalje menja, pa deljenje linka, dugme „nazad" i indeksiranje rade
 * isto kao da je forma poslata bez JavaScripta.
 */
export function GetForm({
  id,
  action,
  className,
  role,
  zatvoriDialogId,
  children,
}: {
  id?: string;
  action: string;
  className?: string;
  role?: string;
  /**
   * Modal koji treba zatvoriti pri slanju. Prosleđuje se kao id, ne kao poziv,
   * da bi forma ostala nezavisna od toga ko je i zašto drži u modalu.
   */
  zatvoriDialogId?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const posalji = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const adresa = adresaIzForme(action, new FormData(event.currentTarget));

    /*
     * Modal se zatvara odmah — korisnik treba da vidi skeleton i rezultate, a
     * ne da ostane zarobljen u panelu dok se učitava.
     */
    if (zatvoriDialogId) {
      const dialog = document.getElementById(zatvoriDialogId);
      if (dialog instanceof HTMLDialogElement && dialog.open) dialog.close();
    }

    startTransition(() => router.push(adresa));
  };

  return (
    <form id={id} action={action} method="get" role={role} onSubmit={posalji} className={className}>
      {children}
    </form>
  );
}
