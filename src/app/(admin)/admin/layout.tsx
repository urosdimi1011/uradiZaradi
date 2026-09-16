import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Administracija",
  robots: { index: false, follow: false },
};

/**
 * Okvir admin dela.
 *
 * Odvojen od javnog layout-a namerno — nema zaglavlje sa pretragom, traku
 * zanata ni podnožje; to su alati za posetioce, ne za moderatora.
 *
 * Provera uloge je ovde, jednom za sve admin stranice. Svaka akcija je
 * svejedno proverava ponovo: ko zna adresu, zna i kako da pozove akciju.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  /* Ne „nemate pristup" nego 404 — postojanje admin dela ne treba potvrđivati. */
  if (user?.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-surface-raised">
        <div className="page-container flex h-14 items-center gap-6">
          <Link href="/admin" className="text-sm font-semibold text-content-primary">
            Administracija
          </Link>
          <Link
            href="/admin/kategorije"
            className="text-sm text-content-secondary transition-colors hover:text-content-primary"
          >
            Kategorije
          </Link>
          <Link
            href="/admin/korisnici"
            className="text-sm text-content-secondary transition-colors hover:text-content-primary"
          >
            Korisnici
          </Link>
          <Link
            href="/admin/recenzije"
            className="text-sm text-content-secondary transition-colors hover:text-content-primary"
          >
            Recenzije
          </Link>
          <Link href="/" className="ml-auto text-sm text-content-muted hover:text-content-primary">
            Nazad na sajt
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
