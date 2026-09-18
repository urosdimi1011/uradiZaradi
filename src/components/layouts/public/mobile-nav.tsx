"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LayoutGrid, Plus, User } from "lucide-react";

import { cn } from "@/lib/cn";
import { jeAktivnaPutanja } from "@/lib/aktivna-putanja";
import { makeT } from "@/lib/dictionary";
import type { Script } from "@/lib/script";
import type { CurrentUser } from "@/lib/session";

/**
 * Donja navigacija sa mockupa. „Poruke" je izbačena jer poruke nisu u MVP opsegu —
 * demo ne sme da obećava funkcionalnost koja nije plaćena ni ugovorena.
 *
 * Korisnik stiže kao prop, ne čita se ovde: `public-layout` ga već ima, pa bi
 * drugi poziv bio drugi upit nad `Session` tabelom pri svakom prikazu stranice.
 */
export function MobileNav({ script, user }: { script: Script; user: CurrentUser | null }) {
  const t = makeT(script);
  const pathname = usePathname();

  /*
   * Profil vodi na nalog, a gosta na prijavu SA POVRATKOM — posle prijave
   * završava tamo gde je i krenuo. Ranije je link bio tvrdo zakucan na
   * `/prijava`, pa je prijavljen korisnik svakim dodirom „Profila" dobijao
   * ekran za prijavu na kom nema šta da radi.
   *
   * Odredište je `/nalog`, ne javni profil majstora: nalog radi za sve uloge,
   * nosi izmene i odjavu, a majstoru čiji je profil još nacrt ne otvara adresu
   * koja javno vraća 404.
   */
  const profil = user
    ? { href: "/nalog", label: t("navProfile") }
    : { href: "/prijava?next=%2Fnalog", label: t("signIn") };

  const items = [
    { href: "/", icon: Home, label: t("navHome") },
    /*
     * Ovde je stajala `/pretraga` — ruta koja nikad nije napravljena i koja je
     * vraćala 404 iz glavne navigacije. Pretraga na telefonu ionako stoji na
     * vrhu početne, pa bi drugo dugme ka istoj adresi bilo prazno. `/kategorije`
     * je jedina stvarna alternativa: pregled svih zanata i njihovih usluga.
     */
    { href: "/kategorije", icon: LayoutGrid, label: t("allCategories") },
    { href: "/sacuvano", icon: Heart, label: t("navSaved") },
    { href: profil.href, icon: User, label: profil.label },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-raised/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="relative grid grid-cols-5 items-end">
        {items.slice(0, 2).map(({ href, icon: Icon, label }) => (
          <NavItem
            key={href}
            href={href}
            icon={Icon}
            label={label}
            active={jeAktivnaPutanja(pathname, href)}
          />
        ))}

        <div className="flex flex-col items-center justify-end pb-1.5">
          <Link
            href="/registracija-majstora"
            className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-brand text-brand-foreground shadow-lg shadow-black/40 transition-colors hover:bg-brand-hover"
            aria-label={t("postJob")}
          >
            <Plus width={26} height={26} aria-hidden />
          </Link>
          <span className="mt-1 text-[10px] font-medium text-brand">{t("postJob")}</span>
        </div>

        {items.slice(2).map(({ href, icon: Icon, label }) => (
          <NavItem
            key={href}
            href={href}
            icon={Icon}
            label={label}
            active={jeAktivnaPutanja(pathname, href)}
          />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: typeof Home;
  label: string;
  /** Stranica na kojoj se već nalazimo — obeležava se brend bojom. */
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center gap-1 py-2.5 transition-colors",
        active ? "text-brand" : "text-content-secondary hover:text-content-primary",
      )}
    >
      <Icon width={20} height={20} aria-hidden />
      <span className="text-center text-[10px] font-medium leading-tight">{label}</span>
    </Link>
  );
}
