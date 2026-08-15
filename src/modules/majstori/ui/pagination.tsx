import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";

/** Server-rendered paginacija sa pravim linkovima — crawler mora da može da prošeta kroz strane. */
export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Paginacija">
      <PageLink href={buildHref(Math.max(1, page - 1))} disabled={page === 1} label="Prethodna">
        <ChevronLeft width={17} height={17} aria-hidden />
      </PageLink>

      {pages.map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} className="px-1 text-content-muted">
            …
          </span>
        ) : (
          <PageLink key={p} href={buildHref(p)} active={p === page} label={`Strana ${p}`}>
            {p}
          </PageLink>
        ),
      )}

      <PageLink
        href={buildHref(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        label="Sledeća"
      >
        <ChevronRight width={17} height={17} aria-hidden />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  children,
  active,
  disabled,
  label,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  label: string;
}) {
  /*
   * Radijus je namerno mali (4px umesto 10px iz `--radius-control`): brojevi
   * strane su gusto poređani, pa jako zaobljeni kvadrati izgledaju kao dugmad
   * i takmiče se sa pravim akcijama na stranici.
   * Cifre su u tabelarnom obliku, da prelaz sa "9" na "10" ne pomeri traku.
   */
  const className = cn(
    "grid h-10 min-w-10 place-items-center rounded-[4px] border px-2 text-base tabular-nums transition-colors",
    active
      ? "border-brand bg-brand/10 font-semibold text-brand"
      : "border-line text-content-secondary hover:border-line-strong hover:text-content-primary",
    disabled && "pointer-events-none opacity-40",
  );

  if (disabled) {
    return (
      <span className={className} aria-disabled>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} aria-current={active ? "page" : undefined} className={className}>
      {children}
    </Link>
  );
}

/** 1 … 4 5 6 … 20 */
function pageWindow(page: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const out: (number | null)[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);

  if (start > 2) out.push(null);
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push(null);
  out.push(total);

  return out;
}
