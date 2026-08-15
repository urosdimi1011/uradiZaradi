import Link from "next/link";
import { Heart, Menu } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { ScriptToggle } from "./script-toggle";
import { makeT } from "@/lib/dictionary";
import type { Script } from "@/lib/script";

/**
 * Žuta linija ispod zaglavlja postoji samo u mobilnom, aplikacijskom prikazu —
 * isti prag (lg) na kom se pojavljuje i donja navigacija, pa gornja i donja ivica
 * ekrana zajedno uokviruju sadržaj kao u aplikaciji.
 * Na desktopu ostaje prigušena ivica, jer bi žuta preko cele širine bila preglasna.
 */
export function SiteHeader({ script }: { script: Script }) {
  const t = makeT(script);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-brand bg-surface-base/95 backdrop-blur supports-[backdrop-filter]:bg-surface-base/80 lg:border-b lg:border-line">
      <div className="page-container flex h-16 items-center gap-4 sm:h-18">
        <Logo script={script} size="sm" />

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ScriptToggle script={script} />

          <Link
            href="/sacuvano"
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-pill)] px-2 text-content-secondary transition-colors hover:text-content-primary"
            aria-label={t("saved")}
          >
            <Heart width={18} height={18} aria-hidden />
            <span className="text-sm tabular-nums">0</span>
          </Link>

          <ButtonLink href="/prijava" variant="outline" size="sm" className="hidden sm:inline-flex">
            {t("signIn")}
          </ButtonLink>
          <ButtonLink href="/registracija-majstora" size="sm" className="hidden sm:inline-flex">
            {t("signUp")}
          </ButtonLink>

          <button
            type="button"
            className="inline-grid h-9 w-9 place-items-center rounded-[var(--radius-control)] text-content-secondary hover:bg-surface-hover hover:text-content-primary sm:hidden"
            aria-label="Meni"
          >
            <Menu width={20} height={20} aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
