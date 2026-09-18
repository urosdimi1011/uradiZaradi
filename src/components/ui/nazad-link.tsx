import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Povratni link iznad sadržaja stranice.
 *
 * Postoji kao komponenta jer je isti link stajao prepisan na profilu, u
 * galeriji i na recenzijama — a svaka izmena je onda tražila tri ista poteza,
 * od kojih se jedan pre ili kasnije zaboravi.
 *
 * Strelica je u brend boji, tekst nije: strelica je oznaka smera i nosi boju
 * radnje, dok bi ceo žut red konkurisao imenu majstora odmah ispod.
 */
export function NazadLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-1 text-sm text-content-secondary transition-colors hover:text-content-primary",
        className,
      )}
    >
      <ChevronLeft
        width={16}
        height={16}
        aria-hidden
        className="text-brand transition-transform group-hover:-translate-x-0.5"
      />
      {children}
    </Link>
  );
}
