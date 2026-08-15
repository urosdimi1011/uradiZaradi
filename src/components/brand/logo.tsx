import Link from "next/link";
import { Hammer, Wrench } from "lucide-react";
import { cn } from "@/lib/cn";
import { ui } from "@/lib/dictionary";
import type { Script } from "@/lib/script";

/**
 * Ukršteni alat + dvoredni naziv, kao u mockupu.
 * Ikona je kompozicija dve lucide ikone umesto custom SVG-a — dizajner kasnije
 * zameni jednim fajlom, a do tada nema mrtvog koda ni pogrešnog vektora.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-block", className)} aria-hidden>
      <Wrench className="absolute inset-0 h-full w-full -scale-x-100 rotate-12 text-content-primary" strokeWidth={2} />
      <Hammer className="absolute inset-0 h-full w-full -rotate-12 text-brand" strokeWidth={2} />
    </span>
  );
}

export function Logo({
  script,
  className,
  size = "md",
}: {
  script: Script;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const line1 = script === "cyrl" ? ui.brandLine1.cyrl : ui.brandLine1.latn;
  const line2 = script === "cyrl" ? ui.brandLine2.cyrl : ui.brandLine2.latn;

  const mark = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" }[size];
  const text = { sm: "text-lg", md: "text-xl", lg: "text-3xl" }[size];

  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={mark} />
      <span className={cn("font-bold leading-[0.95] tracking-tight", text)}>
        <span className="block text-content-primary">{line1}</span>
        <span className="block text-brand">{line2}</span>
      </span>
    </Link>
  );
}
