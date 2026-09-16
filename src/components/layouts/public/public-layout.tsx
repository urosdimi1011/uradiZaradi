import type { ReactNode } from "react";

import { ProfileBanner } from "./profile-banner";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { MobileNav } from "./mobile-nav";
import type { Script } from "@/lib/script";
import type { Category } from "@/modules/catalog/domain";
import { getStanjeProfila } from "@/modules/users/navigation";
import { getCurrentUser } from "@/lib/session";

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
export async function PublicLayout({
  script,
  categories,
  children,
}: {
  script: Script;
  categories: Category[];
  children: ReactNode;
}) {
  /*
   * Jedan upit za ceo prikaz stranice: `getStanjeProfila` je u `cache()`, pa
   * ovaj poziv i onaj iz zaglavlja dele isti rezultat. Za korisnike koji nisu
   * majstori vraća `null` bez ijednog dodira baze.
   */
  const stanjeProfila = await getStanjeProfila(await getCurrentUser());

  return (
    /*
     * `min-h-dvh`, a NE `min-h-full`.
     *
     * `min-h-full` je `min-height: 100%`, a procenat se računa od visine
     * roditelja. `body` ima samo `min-height`, ne i `height`, pa je za dete
     * njegova visina „auto" — i pravilo tiho ne radi ništa. Posledica se vidi
     * na kratkim stranicama: podnožje se popne uz sadržaj i ispod njega ostane
     * prazan ekran.
     *
     * `dvh` meri vidljivi deo prozora i ne zavisi ni od čega iznad. `dvh`, a ne
     * `vh`, jer se na telefonu traka pretraživača skuplja i širi — `vh` bi tamo
     * stalno bio za nekoliko desetina piksela pogrešan.
     *
     * Uz `flex-1` na `main`, sadržaj guta sav višak, pa podnožje uvek stoji na
     * dnu ekrana. To je bolje od fiksne visine tipa `50vh`: radi i na monitoru
     * od 1440px i na telefonu, bez pogađanja broja.
     */
    <div className="flex min-h-dvh flex-col pb-16 lg:pb-0">
      <ProfileBanner stanje={stanjeProfila} />
      <SiteHeader script={script} categories={categories} />
      <main className="flex-1">{children}</main>
      <SiteFooter script={script} />
      <MobileNav script={script} />
    </div>
  );
}
