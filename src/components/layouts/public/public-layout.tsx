import type { ReactNode } from "react";

import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { MobileNav } from "./mobile-nav";
import type { Script } from "@/lib/script";

/**
 * Okvir javnog dela sajta — zaglavlje, podnožje i donja mobilna navigacija.
 *
 * Ovo je server komponenta uprkos imenu foldera. Kad stigne admin panel,
 * pored njega staje `layouts/admin/admin-layout.tsx` sa svojim bočnim menijem,
 * a `app/(admin)/layout.tsx` ga koristi. Dve celine se ne mešaju i nijedna
 * ne nasleđuje tuđe zaglavlje.
 *
 * `pb-16` na mobilnom pravi mesto za fiksiranu donju navigaciju; bez toga
 * poslednja kartica u listi ostaje ispod nje.
 */
export function PublicLayout({ script, children }: { script: Script; children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col pb-16 lg:pb-0">
      <SiteHeader script={script} />
      <main className="flex-1">{children}</main>
      <SiteFooter script={script} />
      <MobileNav script={script} />
    </div>
  );
}
