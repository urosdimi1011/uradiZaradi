import Link from "next/link";
import { Heart, Home, Plus, Search, User } from "lucide-react";

import { makeT } from "@/lib/dictionary";
import type { Script } from "@/lib/script";

/**
 * Donja navigacija sa mockupa. „Poruke" je izbačena jer poruke nisu u MVP opsegu —
 * demo ne sme da obećava funkcionalnost koja nije plaćena ni ugovorena.
 */
export function MobileNav({ script }: { script: Script }) {
  const t = makeT(script);

  const items = [
    { href: "/", icon: Home, label: t("navHome") },
    { href: "/pretraga", icon: Search, label: t("navSearch") },
    { href: "/sacuvano", icon: Heart, label: t("navSaved") },
    { href: "/prijava", icon: User, label: t("navProfile") },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-raised/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="relative grid grid-cols-5 items-end">
        {items.slice(0, 2).map(({ href, icon: Icon, label }) => (
          <NavItem key={href} href={href} icon={Icon} label={label} />
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
          <NavItem key={href} href={href} icon={Icon} label={label} />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Home;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 py-2.5 text-content-secondary transition-colors hover:text-content-primary"
    >
      <Icon width={20} height={20} aria-hidden />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
