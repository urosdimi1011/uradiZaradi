"use client";

import { useRouter } from "next/navigation";
import { useTransition, type FormEvent, type ReactNode } from "react";

import { FILTER_DIALOG_ID } from "./filter-dialog";

/**
 * Filter forma sa klijentskom navigacijom.
 *
 * `action` i `method="get"` ostaju na elementu namerno: bez JavaScripta forma
 * i dalje radi kao obična GET forma. Sa JavaScriptom presrećemo slanje i radimo
 * `router.push`, pa server vraća samo izmenjeni segment umesto celog dokumenta —
 * to je AJAX, ali bez ručnog `fetch`-a i bez gubljenja URL-a.
 *
 * URL se i dalje menja, pa deljenje linka, „nazad" i indeksiranje rade isto.
 */
export function FilterForm({
  id,
  action,
  className,
  children,
}: {
  id: string;
  action: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget).entries()) {
      if (typeof value === "string" && value !== "") params.append(key, value);
    }

    // Modal se zatvara odmah — korisnik treba da vidi skeleton i rezultate,
    // a ne da ostane zarobljen u panelu dok se učitava.
    const dialog = document.getElementById(FILTER_DIALOG_ID);
    if (dialog instanceof HTMLDialogElement && dialog.open) dialog.close();

    const query = params.toString();
    startTransition(() => router.push(query ? `${action}?${query}` : action));
  };

  return (
    <form id={id} action={action} method="get" onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  );
}
