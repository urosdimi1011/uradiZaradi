"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Hammer, LogOut, User } from "lucide-react";

import { signOutAction } from "@/modules/users/actions";
import { makeT } from "@/lib/dictionary";
import type { Script } from "@/lib/script";
import type { CurrentUser } from "@/lib/session";

/**
 * Meni prijavljenog korisnika.
 *
 * Klijentska komponenta je ovde neizbežna — padajući meni traži stanje. Ali
 * podatke o korisniku dobija kao props iz server komponente; ne postoji poziv
 * ka `/api/auth/session` iz pretraživača, pa zaglavlje ne treperi na učitavanju.
 */
export function UserMenu({ user, script }: { user: CurrentUser; script: Script }) {
  const t = makeT(script);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  /*
   * Zatvaranje na klik napolje i na Escape. Bez ovoga meni ostaje otvoren dok
   * se ne klikne ponovo na dugme — što korisnici ne rade, pa im meni visi preko
   * sadržaja.
   */
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  /* Inicijali kao rezerva dok majstor ne postavi sliku. */
  const initials = user.displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-pill)] border border-line px-2 pr-2.5 text-content-primary transition-colors hover:border-line-strong"
      >
        <span className="grid h-6 w-6 place-items-center overflow-hidden rounded-[var(--radius-pill)] bg-surface-hover text-[0.625rem] font-semibold text-content-secondary">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar sa tuđeg domena, bez poznatih dimenzija
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <span className="hidden max-w-28 truncate text-sm sm:inline">{user.displayName}</span>
        <ChevronDown width={14} height={14} aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] w-52 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-card py-1 shadow-lg"
        >
          <Link
            href="/nalog"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-content-primary transition-colors hover:bg-surface-hover"
          >
            {user.role === "MAJSTOR" ? (
              <Hammer width={16} height={16} aria-hidden />
            ) : (
              <User width={16} height={16} aria-hidden />
            )}
            {t("myProfile")}
          </Link>

          {/*
            Odjava je forma, a ne link: menja stanje na serveru. GET link bi
            značio da tuđa stranica može da vas odjavi običnom <img> oznakom.
          */}
          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-content-primary transition-colors hover:bg-surface-hover"
            >
              <LogOut width={16} height={16} aria-hidden />
              {t("signOut")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
